package com.cloudbox.storage;

import com.azure.storage.blob.BlobClient;
import com.azure.storage.blob.BlobContainerClient;
import com.azure.storage.blob.BlobServiceClient;
import com.azure.storage.blob.BlobServiceClientBuilder;
import com.azure.storage.common.StorageSharedKeyCredential;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Azure Blob Storage adapter implementing the CloudStorageAdapter interface.
 */
@Component
public class AzureStorageAdapter implements CloudStorageAdapter {

    private static final Logger log = LoggerFactory.getLogger(AzureStorageAdapter.class);

    private BlobServiceClient blobServiceClient;
    private BlobContainerClient containerClient;
    // Fields stored for potential future use (logging, diagnostics)
    @SuppressWarnings("unused")
    private String accountName;
    @SuppressWarnings("unused")
    private String containerName;

    public AzureStorageAdapter() {
    }

    /**
     * Configure the Azure adapter with connection string.
     */
    public void configure(String connectionString, String containerName) {
        this.containerName = containerName;

        this.blobServiceClient = new BlobServiceClientBuilder()
                .connectionString(connectionString)
                .buildClient();

        this.containerClient = blobServiceClient.getBlobContainerClient(containerName);

        // Create container if it doesn't exist
        if (!containerClient.exists()) {
            containerClient.create();
        }

        this.accountName = blobServiceClient.getAccountName();
        log.info("Azure Storage Adapter configured for container: {}", containerName);
    }

    /**
     * Configure the Azure adapter with account name and key.
     */
    public void configure(String accountName, String accountKey, String containerName) {
        this.accountName = accountName;
        this.containerName = containerName;

        String endpoint = String.format("https://%s.blob.core.windows.net", accountName);
        StorageSharedKeyCredential credential = new StorageSharedKeyCredential(accountName, accountKey);

        this.blobServiceClient = new BlobServiceClientBuilder()
                .endpoint(endpoint)
                .credential(credential)
                .buildClient();

        this.containerClient = blobServiceClient.getBlobContainerClient(containerName);

        if (!containerClient.exists()) {
            containerClient.create();
        }

        log.info("Azure Storage Adapter configured for container: {}", containerName);
    }

    @Override
    public ProviderType getProviderType() {
        return ProviderType.AZURE_BLOB;
    }

    @Override
    public String getProviderName() {
        return "Azure Blob Storage";
    }

    @Override
    public boolean testConnection() {
        try {
            return containerClient.exists();
        } catch (Exception e) {
            log.error("Azure connection test failed: {}", e.getMessage());
            return false;
        }
    }

    @Override
    public String uploadFile(InputStream content, long size, String fileName, String contentType) {
        String blobName = buildObjectName(fileName);

        try {
            BlobClient blobClient = containerClient.getBlobClient(blobName);
            blobClient.upload(content, size);

            // Set content type
            if (contentType != null) {
                blobClient.setHttpHeaders(new com.azure.storage.blob.models.BlobHttpHeaders()
                        .setContentType(contentType));
            }

            return blobName;
        } catch (Exception e) {
            throw new RuntimeException("Failed to upload file to Azure", e);
        }
    }

    @Override
    public void replaceFile(String storageKey, byte[] content, String contentType) {
        try {
            BlobClient blobClient = containerClient.getBlobClient(storageKey);
            blobClient.upload(new ByteArrayInputStream(content), content.length, true);

            if (contentType != null) {
                blobClient.setHttpHeaders(new com.azure.storage.blob.models.BlobHttpHeaders()
                        .setContentType(contentType));
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to replace file in Azure: " + storageKey, e);
        }
    }

    @Override
    public InputStream downloadFile(String storageKey) {
        try {
            BlobClient blobClient = containerClient.getBlobClient(storageKey);
            return blobClient.openInputStream();
        } catch (Exception e) {
            throw new RuntimeException("Failed to download file from Azure: " + storageKey, e);
        }
    }

    @Override
    public void deleteFile(String storageKey) {
        try {
            BlobClient blobClient = containerClient.getBlobClient(storageKey);
            blobClient.delete();
        } catch (Exception e) {
            throw new RuntimeException("Failed to delete file from Azure", e);
        }
    }

    @Override
    public List<CloudFile> listFiles(String path) {
        List<CloudFile> files = new ArrayList<>();

        try {
            String prefix = (path == null || path.isEmpty()) ? "" : path;
            if (!prefix.isEmpty() && !prefix.endsWith("/")) {
                prefix = prefix + "/";
            }

            // List blobs with options for prefix filtering
            com.azure.storage.blob.models.ListBlobsOptions options = new com.azure.storage.blob.models.ListBlobsOptions()
                    .setPrefix(prefix);

            for (com.azure.storage.blob.models.BlobItem blobItem : containerClient.listBlobs(options, null)) {
                String blobName = blobItem.getName();

                // Skip the prefix itself
                if (blobName.equals(prefix))
                    continue;

                // Determine if it's a "folder" (virtual)
                boolean isFolder = blobName.endsWith("/");

                if (isFolder) {
                    String folderName = blobName.substring(prefix.length(), blobName.length() - 1);
                    files.add(new CloudFile(
                            blobName,
                            folderName,
                            blobName,
                            0L,
                            null,
                            blobItem.getProperties().getLastModified() != null
                                    ? blobItem.getProperties().getLastModified().toInstant()
                                    : Instant.now(),
                            ProviderType.AZURE_BLOB,
                            true,
                            blobName));
                } else {
                    String name = blobName.substring(prefix.length());
                    var properties = blobItem.getProperties();

                    files.add(new CloudFile(
                            blobName,
                            name,
                            blobName,
                            properties.getContentLength() != null ? properties.getContentLength() : 0L,
                            properties.getContentType(),
                            properties.getLastModified() != null ? properties.getLastModified().toInstant()
                                    : Instant.now(),
                            ProviderType.AZURE_BLOB,
                            false,
                            blobName));
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to list files from Azure", e);
        }

        return files;
    }

    @Override
    public void createFolder(String path) {
        // In Azure, virtual folders are created as empty blobs with trailing /
        String folderPath = path.endsWith("/") ? path : path + "/";

        try {
            BlobClient blobClient = containerClient.getBlobClient(folderPath);
            blobClient.upload(new java.io.ByteArrayInputStream(new byte[0]), 0);
        } catch (Exception e) {
            throw new RuntimeException("Failed to create folder in Azure", e);
        }
    }

    @Override
    public void deleteFolder(String path) {
        String prefix = path.endsWith("/") ? path : path + "/";

        try {
            var options = new com.azure.storage.blob.models.ListBlobsOptions().setPrefix(prefix);

            for (com.azure.storage.blob.models.BlobItem blobItem : containerClient.listBlobs(options, null)) {
                BlobClient blobClient = containerClient.getBlobClient(blobItem.getName());
                blobClient.delete();
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to delete folder from Azure", e);
        }
    }

    @Override
    public CloudFile getFileMetadata(String storageKey) {
        try {
            BlobClient blobClient = containerClient.getBlobClient(storageKey);
            var properties = blobClient.getProperties();

            String name = storageKey.substring(storageKey.lastIndexOf('/') + 1);

            long size = 0L;
            try {
                size = properties.getBlobSize();
            } catch (Exception ignored) {
            }

            return new CloudFile(
                    storageKey,
                    name,
                    storageKey,
                    size,
                    properties.getContentType(),
                    properties.getLastModified() != null ? properties.getLastModified().toInstant() : Instant.now(),
                    ProviderType.AZURE_BLOB,
                    false,
                    storageKey);
        } catch (Exception e) {
            return null;
        }
    }

    @Override
    public String getFileUrl(String storageKey) {
        BlobClient blobClient = containerClient.getBlobClient(storageKey);
        return blobClient.getBlobUrl();
    }

    private String buildObjectName(String fileName) {
        String safeName = fileName.replace("\\", "_")
                .replace("/", "_")
                .replaceAll("\\s+", "_");
        return "user-files/" + System.currentTimeMillis() + "_" + safeName;
    }
}