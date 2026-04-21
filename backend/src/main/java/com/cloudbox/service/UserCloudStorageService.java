package com.cloudbox.service;

import com.cloudbox.model.CloudProviderEntity;
import com.cloudbox.repository.CloudProviderRepository;
import com.cloudbox.storage.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;

/**
 * Routes file operations to the correct storage provider for a given user.
 * Uses the user's configured default provider when uploading.
 */
@Service
public class UserCloudStorageService {

    public record StoredObject(ProviderType providerType, String storageKey, String fileUrl) {
    }

    private final CloudProviderRepository cloudProviderRepository;
    private final MinioStorageService globalMinioStorage;
    private final LocalStorageService localStorageService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public UserCloudStorageService(
            CloudProviderRepository cloudProviderRepository,
            MinioStorageService globalMinioStorage,
            LocalStorageService localStorageService) {
        this.cloudProviderRepository = cloudProviderRepository;
        this.globalMinioStorage = globalMinioStorage;
        this.localStorageService = localStorageService;
    }

    public ProviderType resolveDefaultProvider(Long userId) {
        return cloudProviderRepository.findByUserIdAndIsDefaultTrue(userId)
                .map(CloudProviderEntity::getProviderType)
                .orElse(ProviderType.MINIO);
    }

    public StoredObject uploadToDefaultProvider(Long userId, MultipartFile file) throws Exception {
        ProviderType provider = resolveDefaultProvider(userId);
        return uploadToProvider(userId, provider, file);
    }

    public StoredObject uploadToProvider(Long userId, ProviderType provider, MultipartFile file) throws Exception {
        if (provider == null)
            provider = ProviderType.MINIO;

        // If provider is configured for this user, prefer their config. Otherwise fall
        // back.
        CloudProviderEntity configured = cloudProviderRepository.findByUserIdAndProviderType(userId, provider)
                .orElse(null);

        if (provider == ProviderType.MINIO && configured == null) {
            MinioStorageService.StoredFile stored = globalMinioStorage.uploadFile(file);
            return new StoredObject(ProviderType.MINIO, stored.fileName(), stored.fileUrl());
        }

        if (provider == ProviderType.LOCAL && configured == null) {
            LocalStorageService.StoredFile stored = localStorageService.uploadFile(file);
            return new StoredObject(ProviderType.LOCAL, stored.storageKey(), stored.fileUrl());
        }

        CloudStorageAdapter adapter = buildAdapterFromConfig(provider, configured);
        try (InputStream in = file.getInputStream()) {
            String key = adapter.uploadFile(in, file.getSize(), file.getOriginalFilename(), file.getContentType());
            String url = adapter.getFileUrl(key);
            return new StoredObject(provider, key, url);
        }
    }

    public byte[] readFileBytes(ProviderType provider, Long userId, String storageKey) {
        ProviderType p = provider != null ? provider : ProviderType.MINIO;
        if (p == ProviderType.MINIO) {
            return globalMinioStorage.getFileBytes(storageKey);
        }
        if (p == ProviderType.LOCAL) {
            try {
                return localStorageService.readFile(storageKey);
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        }
        CloudProviderEntity configured = cloudProviderRepository.findByUserIdAndProviderType(userId, p)
                .orElseThrow(() -> new IllegalArgumentException("Provider not configured: " + p));
        CloudStorageAdapter adapter = buildAdapterFromConfig(p, configured);
        return adapter.getFileBytes(storageKey);
    }

    public void replaceFileBytes(ProviderType provider, Long userId, String storageKey, byte[] content,
            String contentType) {
        ProviderType p = provider != null ? provider : ProviderType.MINIO;
        if (p == ProviderType.MINIO) {
            globalMinioStorage.replaceFile(storageKey, content, contentType);
            return;
        }
        if (p == ProviderType.LOCAL) {
            try {
                localStorageService.writeFile(storageKey, content);
                return;
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        }
        CloudProviderEntity configured = cloudProviderRepository.findByUserIdAndProviderType(userId, p)
                .orElseThrow(() -> new IllegalArgumentException("Provider not configured: " + p));
        CloudStorageAdapter adapter = buildAdapterFromConfig(p, configured);
        adapter.replaceFile(storageKey, content, contentType);
    }

    public void deleteObject(ProviderType provider, Long userId, String storageKey) {
        ProviderType p = provider != null ? provider : ProviderType.MINIO;
        if (p == ProviderType.MINIO) {
            globalMinioStorage.deleteFile(storageKey);
            return;
        }
        if (p == ProviderType.LOCAL) {
            localStorageService.deleteFile(storageKey);
            return;
        }
        CloudProviderEntity configured = cloudProviderRepository.findByUserIdAndProviderType(userId, p)
                .orElseThrow(() -> new IllegalArgumentException("Provider not configured: " + p));
        CloudStorageAdapter adapter = buildAdapterFromConfig(p, configured);
        adapter.deleteFile(storageKey);
    }

    private CloudStorageAdapter buildAdapterFromConfig(ProviderType provider, CloudProviderEntity entity) {
        if (entity == null) {
            throw new IllegalArgumentException("Provider not configured: " + provider);
        }

        JsonNode creds = readJson(entity.getCredentialsEncrypted());
        JsonNode cfg = readJson(entity.getConfigJson());

        return switch (provider) {
            case AWS_S3 -> {
                S3StorageAdapter s3 = new S3StorageAdapter();
                String accessKey = text(creds, "accessKey");
                String secretKey = text(creds, "secretKey");
                String bucket = text(cfg, "bucket");
                String region = text(cfg, "region");
                String endpoint = text(cfg, "endpoint");
                if (endpoint != null && !endpoint.isBlank()) {
                    s3.configure(accessKey, secretKey, bucket, region, endpoint);
                } else {
                    s3.configure(accessKey, secretKey, bucket, region);
                }
                yield s3;
            }
            case GCS -> {
                GcsStorageAdapter gcs = new GcsStorageAdapter();
                String projectId = text(cfg, "projectId");
                String bucket = text(cfg, "bucket");
                String jsonCredentials = text(creds, "jsonCredentials");
                String jsonKeyPath = text(cfg, "jsonKeyPath");
                if (jsonCredentials != null && !jsonCredentials.isBlank()) {
                    gcs.configureWithJson(projectId, jsonCredentials, bucket);
                } else {
                    gcs.configure(projectId, jsonKeyPath, bucket);
                }
                yield gcs;
            }
            case AZURE_BLOB -> {
                AzureStorageAdapter azure = new AzureStorageAdapter();
                String containerName = text(cfg, "containerName");
                String connectionString = text(creds, "connectionString");
                String accountName = text(creds, "accountName");
                String accountKey = text(creds, "accountKey");
                if (connectionString != null && !connectionString.isBlank()) {
                    azure.configure(connectionString, containerName);
                } else {
                    azure.configure(accountName, accountKey, containerName);
                }
                yield azure;
            }
            case MINIO -> {
                MinioS3CompatibleAdapter minio = new MinioS3CompatibleAdapter();
                String accessKey = text(creds, "accessKey");
                String secretKey = text(creds, "secretKey");
                String bucket = text(cfg, "bucket");
                String region = text(cfg, "region");
                String endpoint = text(cfg, "endpoint");
                minio.configure(accessKey, secretKey, bucket, region, endpoint);
                yield minio;
            }
            case LOCAL -> {
                String uploadDir = text(cfg, "uploadDir");
                yield new LocalStorageAdapter(uploadDir == null || uploadDir.isBlank() ? "uploads/" : uploadDir);
            }
            default -> throw new IllegalArgumentException("Unsupported provider for per-user config: " + provider);
        };
    }

    private JsonNode readJson(String json) {
        if (json == null || json.isBlank())
            return objectMapper.createObjectNode();
        try {
            return objectMapper.readTree(json);
        } catch (Exception e) {
            return objectMapper.createObjectNode();
        }
    }

    private String text(JsonNode node, String key) {
        if (node == null || !node.has(key) || node.get(key).isNull())
            return null;
        String v = node.get(key).asText();
        return (v != null && v.isBlank()) ? null : v;
    }
}
