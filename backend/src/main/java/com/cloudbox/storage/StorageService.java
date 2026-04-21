package com.cloudbox.storage;

import com.cloudbox.service.LocalStorageAdapter;
import com.cloudbox.service.MinioStorageAdapter;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Unified storage service facade that manages all cloud storage adapters.
 * MinIO is the default provider, but additional providers can be registered.
 */
@Service
public class StorageService {

    private static final Logger log = LoggerFactory.getLogger(StorageService.class);

    private final Map<ProviderType, CloudStorageAdapter> adapters = new ConcurrentHashMap<>();

    @Value("${storage.default-provider:MINIO}")
    private String defaultProviderName;

    private ProviderType defaultProvider;

    @Autowired
    private MinioStorageAdapter minioAdapter;

    @Autowired
    private LocalStorageAdapter localAdapter;

    @Autowired
    private S3StorageAdapter s3StorageAdapter;

    @Autowired
    private GcsStorageAdapter gcsStorageAdapter;

    @Autowired
    private AzureStorageAdapter azureStorageAdapter;

    @PostConstruct
    public void init() {
        // Register all available adapters
        registerAdapter(minioAdapter);
        registerAdapter(localAdapter);
        registerAdapter(s3StorageAdapter);
        registerAdapter(gcsStorageAdapter);
        registerAdapter(azureStorageAdapter);

        // Set default provider
        try {
            this.defaultProvider = ProviderType.valueOf(defaultProviderName);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid default provider: {}, defaulting to MINIO", defaultProviderName);
            this.defaultProvider = ProviderType.MINIO;
        }

        log.info("StorageService initialized with default provider: {}", defaultProvider);
    }

    /**
     * Register a storage adapter for a provider type.
     */
    public void registerAdapter(CloudStorageAdapter adapter) {
        adapters.put(adapter.getProviderType(), adapter);
        log.info("Registered storage adapter: {}", adapter.getProviderName());
    }

    /**
     * Get the adapter for a specific provider type.
     */
    public CloudStorageAdapter getAdapter(ProviderType type) {
        CloudStorageAdapter adapter = adapters.get(type);
        if (adapter == null) {
            throw new IllegalArgumentException("Storage provider not registered: " + type);
        }
        return adapter;
    }

    /**
     * Get the default provider type.
     */
    public ProviderType getDefaultProvider() {
        return defaultProvider;
    }

    /**
     * Set the default provider type.
     */
    public void setDefaultProvider(ProviderType provider) {
        if (!adapters.containsKey(provider)) {
            throw new IllegalArgumentException("Cannot set unregistered provider as default: " + provider);
        }
        this.defaultProvider = provider;
        log.info("Default storage provider changed to: {}", provider);
    }

    /**
     * Get all registered provider types.
     */
    public Map<ProviderType, String> getRegisteredProviders() {
        Map<ProviderType, String> providers = new ConcurrentHashMap<>();
        adapters.forEach((type, adapter) -> providers.put(type, adapter.getProviderName()));
        return providers;
    }

    // ==================== Unified Operations ====================

    /**
     * Upload a file using the default provider.
     */
    public String uploadFile(InputStream content, long size, String fileName, String contentType) {
        return uploadFile(defaultProvider, content, size, fileName, contentType);
    }

    /**
     * Upload a file to a specific provider.
     */
    public String uploadFile(ProviderType provider, InputStream content, long size,
            String fileName, String contentType) {
        return getAdapter(provider).uploadFile(content, size, fileName, contentType);
    }

    /**
     * Download a file from the default provider.
     */
    public InputStream downloadFile(String storageKey) {
        return downloadFile(defaultProvider, storageKey);
    }

    /**
     * Download a file from a specific provider.
     */
    public InputStream downloadFile(ProviderType provider, String storageKey) {
        return getAdapter(provider).downloadFile(storageKey);
    }

    /**
     * Delete a file from the default provider.
     */
    public void deleteFile(String storageKey) {
        deleteFile(defaultProvider, storageKey);
    }

    /**
     * Delete a file from a specific provider.
     */
    public void deleteFile(ProviderType provider, String storageKey) {
        getAdapter(provider).deleteFile(storageKey);
    }

    /**
     * List files in the default provider.
     */
    public List<CloudFile> listFiles(String path) {
        return listFiles(defaultProvider, path);
    }

    /**
     * List files in a specific provider.
     */
    public List<CloudFile> listFiles(ProviderType provider, String path) {
        return getAdapter(provider).listFiles(path);
    }

    /**
     * Create a folder in the default provider.
     */
    public void createFolder(String path) {
        createFolder(defaultProvider, path);
    }

    /**
     * Create a folder in a specific provider.
     */
    public void createFolder(ProviderType provider, String path) {
        getAdapter(provider).createFolder(path);
    }

    /**
     * Delete a folder from the default provider.
     */
    public void deleteFolder(String path) {
        deleteFolder(defaultProvider, path);
    }

    /**
     * Delete a folder from a specific provider.
     */
    public void deleteFolder(ProviderType provider, String path) {
        getAdapter(provider).deleteFolder(path);
    }

    /**
     * Get file metadata from the default provider.
     */
    public CloudFile getFileMetadata(String storageKey) {
        return getFileMetadata(defaultProvider, storageKey);
    }

    /**
     * Get file metadata from a specific provider.
     */
    public CloudFile getFileMetadata(ProviderType provider, String storageKey) {
        return getAdapter(provider).getFileMetadata(storageKey);
    }

    /**
     * Get a direct access URL for a file.
     */
    public String getFileUrl(String storageKey) {
        return getFileUrl(defaultProvider, storageKey);
    }

    /**
     * Get a direct access URL for a file from a specific provider.
     */
    public String getFileUrl(ProviderType provider, String storageKey) {
        return getAdapter(provider).getFileUrl(storageKey);
    }

    /**
     * Test connection to a specific provider.
     */
    public boolean testConnection(ProviderType provider) {
        try {
            return getAdapter(provider).testConnection();
        } catch (Exception e) {
            log.error("Connection test failed for provider {}: {}", provider, e.getMessage());
            return false;
        }
    }

    /**
     * Test connection to all registered providers.
     */
    public Map<ProviderType, Boolean> testAllConnections() {
        Map<ProviderType, Boolean> results = new ConcurrentHashMap<>();
        adapters.keySet().forEach(provider -> {
            results.put(provider, testConnection(provider));
        });
        return results;
    }

    // ==================== Cross-Provider Operations ====================

    /**
     * Copy a file between two providers.
     */
    public void copyBetweenProviders(ProviderType from, ProviderType to,
            String sourceKey, String destFileName) {
        CloudStorageAdapter fromAdapter = getAdapter(from);
        CloudStorageAdapter toAdapter = getAdapter(to);

        try (InputStream content = fromAdapter.downloadFile(sourceKey)) {
            CloudFile metadata = fromAdapter.getFileMetadata(sourceKey);
            long size = metadata != null ? metadata.size() : 0L;
            String contentType = metadata != null ? metadata.contentType() : "application/octet-stream";

            toAdapter.uploadFile(content, size, destFileName, contentType);
        } catch (Exception e) {
            throw new RuntimeException("Failed to copy file between providers", e);
        }
    }

    /**
     * Move a file between two providers (copy + delete).
     */
    public void moveBetweenProviders(ProviderType from, ProviderType to,
            String sourceKey, String destFileName) {
        copyBetweenProviders(from, to, sourceKey, destFileName);
        CloudStorageAdapter fromAdapter = getAdapter(from);
        fromAdapter.deleteFile(sourceKey);
    }

    /**
     * Configure a specific provider with user credentials.
     * This allows users to use their own cloud storage accounts.
     */
    public void configureProvider(ProviderType provider, String... credentials) {
        CloudStorageAdapter adapter = getAdapter(provider);

        switch (provider) {
            case AWS_S3 -> {
                if (credentials.length >= 4) {
                    ((S3StorageAdapter) adapter).configure(
                            credentials[0], credentials[1], credentials[2], credentials[3]);
                }
            }
            case AZURE_BLOB -> {
                if (credentials.length >= 2) {
                    ((AzureStorageAdapter) adapter).configure(
                            credentials[0], credentials[1]);
                }
            }
            case GCS -> {
                if (credentials.length >= 3) {
                    ((GcsStorageAdapter) adapter).configure(
                            credentials[0], credentials[1], credentials[2]);
                }
            }
            default -> log.warn("Provider {} does not support configuration", provider);
        }

        log.info("Configured storage provider: {}", provider);
    }
}