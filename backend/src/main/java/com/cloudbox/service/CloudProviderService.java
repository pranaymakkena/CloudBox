package com.cloudbox.service;

import com.cloudbox.dto.CloudProviderRequest;
import com.cloudbox.dto.CloudProviderResponse;
import com.cloudbox.model.CloudProviderEntity;
import com.cloudbox.repository.CloudProviderRepository;
import com.cloudbox.storage.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for managing user's cloud storage provider configurations.
 */
@Service
public class CloudProviderService {

    private static final Logger log = LoggerFactory.getLogger(CloudProviderService.class);

    @Autowired
    private CloudProviderRepository cloudProviderRepository;

    @Autowired
    private StorageService storageService;

    @Autowired
    private S3StorageAdapter s3StorageAdapter;

    @Autowired
    private GcsStorageAdapter gcsStorageAdapter;

    @Autowired
    private AzureStorageAdapter azureStorageAdapter;

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Add a new cloud provider for a user.
     */
    public CloudProviderResponse addProvider(Long userId, CloudProviderRequest request) {
        // Check if provider already exists for this user
        if (cloudProviderRepository.existsByUserIdAndProviderType(userId, request.getProviderType())) {
            throw new IllegalArgumentException("Provider already configured: " + request.getProviderType());
        }

        // Test connection before saving
        boolean connectionSuccessful = testProviderConnection(request);
        if (!connectionSuccessful) {
            throw new IllegalArgumentException("Failed to connect to provider. Please check your credentials.");
        }

        // Create entity
        CloudProviderEntity entity = new CloudProviderEntity();
        entity.setUserId(userId);
        entity.setProviderType(request.getProviderType());
        entity.setProviderName(request.getProviderName() != null ? 
            request.getProviderName() : request.getProviderType().getDisplayName());
        entity.setConnected(true);
        entity.setActive(true);

        // Store credentials and config
        entity.setCredentialsEncrypted(encryptCredentials(request));
        entity.setConfigJson(buildConfigJson(request));

        // Handle default provider
        if (request.isSetAsDefault()) {
            clearExistingDefault(userId);
            entity.setDefault(true);
        }

        // Save and return
        CloudProviderEntity saved = cloudProviderRepository.save(entity);
        log.info("Cloud provider added for user {}: {}", userId, request.getProviderType());
        
        return toResponse(saved);
    }

    /**
     * Get all providers for a user.
     */
    public List<CloudProviderResponse> getProviders(Long userId) {
        return cloudProviderRepository.findByUserIdAndActiveTrue(userId)
            .stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    /**
     * Get a specific provider.
     */
    public CloudProviderResponse getProvider(Long userId, Long providerId) {
        CloudProviderEntity entity = cloudProviderRepository.findById(providerId)
            .orElseThrow(() -> new IllegalArgumentException("Provider not found"));
        
        if (!entity.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Access denied");
        }
        
        return toResponse(entity);
    }

    /**
     * Update provider (e.g., set as default).
     */
    public CloudProviderResponse updateProvider(Long userId, Long providerId, boolean setAsDefault) {
        CloudProviderEntity entity = cloudProviderRepository.findById(providerId)
            .orElseThrow(() -> new IllegalArgumentException("Provider not found"));
        
        if (!entity.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Access denied");
        }

        if (setAsDefault) {
            clearExistingDefault(userId);
            entity.setDefault(true);
            entity = cloudProviderRepository.save(entity);
        }

        return toResponse(entity);
    }

    /**
     * Remove a provider.
     */
    public void removeProvider(Long userId, Long providerId) {
        CloudProviderEntity entity = cloudProviderRepository.findById(providerId)
            .orElseThrow(() -> new IllegalArgumentException("Provider not found"));
        
        if (!entity.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Access denied");
        }

        cloudProviderRepository.delete(entity);
        log.info("Cloud provider removed for user {}: {}", userId, entity.getProviderType());
    }

    /**
     * Test connection to a provider.
     */
    public boolean testProviderConnection(CloudProviderRequest request) {
        try {
            switch (request.getProviderType()) {
                case AWS_S3 -> {
                    if (request.getEndpoint() != null && !request.getEndpoint().isEmpty()) {
                        s3StorageAdapter.configure(
                            request.getAccessKey(), request.getSecretKey(),
                            request.getBucket(), request.getRegion(), request.getEndpoint());
                    } else {
                        s3StorageAdapter.configure(
                            request.getAccessKey(), request.getSecretKey(),
                            request.getBucket(), request.getRegion());
                    }
                    return s3StorageAdapter.testConnection();
                }
                case GCS -> {
                    if (request.getJsonCredentials() != null) {
                        gcsStorageAdapter.configureWithJson(
                            request.getProjectId(), request.getJsonCredentials(), request.getBucket());
                    } else {
                        gcsStorageAdapter.configure(
                            request.getProjectId(), request.getJsonKeyPath(), request.getBucket());
                    }
                    return gcsStorageAdapter.testConnection();
                }
                case AZURE_BLOB -> {
                    if (request.getConnectionString() != null) {
                        azureStorageAdapter.configure(request.getConnectionString(), request.getContainerName());
                    } else {
                        azureStorageAdapter.configure(
                            request.getAccountName(), request.getAccountKey(), request.getContainerName());
                    }
                    return azureStorageAdapter.testConnection();
                }
                case MINIO -> {
                    // Treat MinIO as S3-compatible endpoint configured by user
                    String endpoint = request.getEndpoint();
                    if (endpoint == null || endpoint.isBlank()) {
                        throw new IllegalArgumentException("MinIO endpoint is required");
                    }
                    String region = (request.getRegion() == null || request.getRegion().isBlank())
                            ? "us-east-1"
                            : request.getRegion();
                    // Use a dedicated S3-compatible adapter to avoid mutating the AWS adapter config
                    MinioS3CompatibleAdapter minio = new MinioS3CompatibleAdapter();
                    minio.configure(request.getAccessKey(), request.getSecretKey(),
                            request.getBucket(), region, endpoint);
                    return minio.testConnection();
                }
                case LOCAL -> {
                    String dir = (request.getUploadDir() == null || request.getUploadDir().isBlank())
                            ? "uploads/"
                            : request.getUploadDir();
                    return new com.cloudbox.service.LocalStorageAdapter(dir).testConnection();
                }
                default -> {
                    // Fall back to globally configured adapters if available
                    return storageService.testConnection(request.getProviderType());
                }
            }
        } catch (Exception e) {
            log.error("Provider connection test failed: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Get the effective storage adapter for a user's provider.
     */
    public CloudStorageAdapter getStorageAdapter(CloudProviderEntity provider) {
        // For now, return the default MinIO adapter
        // In production, you'd instantiate per-user adapters with their credentials
        return storageService.getAdapter(ProviderType.MINIO);
    }

    // Helper methods

    private void clearExistingDefault(Long userId) {
        cloudProviderRepository.findByUserIdAndActiveTrue(userId)
            .forEach(p -> {
                if (p.isDefault()) {
                    p.setDefault(false);
                    cloudProviderRepository.save(p);
                }
            });
    }

    private String encryptCredentials(CloudProviderRequest request) {
        // In production, use AES-256 encryption with a user-specific key
        // For now, store as JSON (NOT SECURE - should be encrypted)
        try {
            return objectMapper.writeValueAsString(new CredentialsHolder(
                request.getAccessKey(),
                request.getSecretKey(),
                request.getJsonCredentials(),
                request.getConnectionString(),
                request.getAccountName(),
                request.getAccountKey()
            ));
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize credentials", e);
        }
    }

    private String buildConfigJson(CloudProviderRequest request) {
        try {
            return objectMapper.writeValueAsString(new ConfigHolder(
                request.getBucket(),
                request.getRegion(),
                request.getEndpoint(),
                request.getProjectId(),
                request.getJsonKeyPath(),
                request.getContainerName(),
                request.getUploadDir()
            ));
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize config", e);
        }
    }

    private CloudProviderResponse toResponse(CloudProviderEntity entity) {
        CloudProviderResponse response = new CloudProviderResponse();
        response.setId(entity.getId());
        response.setProviderType(entity.getProviderType());
        response.setProviderName(entity.getProviderName());
        response.setActive(entity.isActive());
        response.setDefault(entity.isDefault());
        response.setConnected(entity.isConnected());
        response.setLastSyncAt(entity.getLastSyncAt());
        response.setCreatedAt(entity.getCreatedAt());

        // Parse config to extract non-sensitive info
        try {
            if (entity.getConfigJson() != null) {
                JsonNode config = objectMapper.readTree(entity.getConfigJson());
                response.setRegion(config.has("region") ? config.get("region").asText() : null);
                response.setBucket(config.has("bucket") ? config.get("bucket").asText() : null);
                response.setContainerName(config.has("containerName") ? config.get("containerName").asText() : null);
            }
        } catch (Exception ignored) {}

        return response;
    }

    // Inner classes for serialization
    private record CredentialsHolder(
        String accessKey, String secretKey, String jsonCredentials,
        String connectionString, String accountName, String accountKey
    ) {}

    private record ConfigHolder(
        String bucket, String region, String endpoint, 
        String projectId, String jsonKeyPath, String containerName, String uploadDir
    ) {}
}