package com.cloudbox.storage;

import com.google.auth.oauth2.ServiceAccountCredentials;
import com.google.cloud.storage.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Google Cloud Storage adapter implementing the CloudStorageAdapter interface.
 */
@Component
public class GcsStorageAdapter implements CloudStorageAdapter {

    private static final Logger log = LoggerFactory.getLogger(GcsStorageAdapter.class);

    private Storage storage;
    private String bucketName;
    // projectId stored for potential future use
    @SuppressWarnings("unused")
    private String projectId;

    public GcsStorageAdapter() {
    }

    /**
     * Configure the GCS adapter with service account credentials.
     */
    public void configure(String projectId, String jsonKeyPath, String bucket) {
        this.projectId = projectId;
        this.bucketName = bucket;

        try {
            this.storage = StorageOptions.newBuilder()
                    .setProjectId(projectId)
                    .setCredentials(ServiceAccountCredentials.fromStream(
                            new java.io.FileInputStream(jsonKeyPath)))
                    .build()
                    .getService();

            log.info("GCS Storage Adapter configured for bucket: {}", bucket);
        } catch (Exception e) {
            throw new RuntimeException("Failed to configure GCS adapter", e);
        }
    }

    /**
     * Configure the GCS adapter with JSON credentials string.
     */
    public void configureWithJson(String projectId, String jsonCredentials, String bucket) {
        this.projectId = projectId;
        this.bucketName = bucket;

        try {
            // Write JSON to a temp file and use fromStream
            java.nio.file.Path tempFile = java.nio.file.Files.createTempFile("gcs-credentials", ".json");
            java.nio.file.Files.write(tempFile, jsonCredentials.getBytes());

            com.google.auth.oauth2.GoogleCredentials credentials = com.google.auth.oauth2.GoogleCredentials.fromStream(
                    new java.io.FileInputStream(tempFile.toFile()));

            // Clean up temp file
            java.nio.file.Files.deleteIfExists(tempFile);

            this.storage = StorageOptions.newBuilder()
                    .setProjectId(projectId)
                    .setCredentials(credentials)
                    .build()
                    .getService();

            log.info("GCS Storage Adapter configured for bucket: {}", bucket);
        } catch (Exception e) {
            throw new RuntimeException("Failed to configure GCS adapter", e);
        }
    }

    @Override
    public ProviderType getProviderType() {
        return ProviderType.GCS;
    }

    @Override
    public String getProviderName() {
        return "Google Cloud Storage";
    }

    @Override
    public boolean testConnection() {
        try {
            return storage.get(bucketName) != null;
        } catch (Exception e) {
            log.error("GCS connection test failed: {}", e.getMessage());
            return false;
        }
    }

    @Override
    public String uploadFile(InputStream content, long size, String fileName, String contentType) {
        String blobId = buildObjectName(fileName);

        try {
            // Read InputStream into byte array
            byte[] contentBytes = content.readAllBytes();

            BlobId blobIdObj = BlobId.of(bucketName, blobId);
            BlobInfo blobInfo = BlobInfo.newBuilder(blobIdObj)
                    .setContentType(contentType != null ? contentType : "application/octet-stream")
                    .build();

            storage.create(blobInfo, contentBytes);
            return blobId;
        } catch (Exception e) {
            throw new RuntimeException("Failed to upload file to GCS", e);
        }
    }

    @Override
    public void replaceFile(String storageKey, byte[] content, String contentType) {
        try {
            BlobId blobIdObj = BlobId.of(bucketName, storageKey);
            BlobInfo blobInfo = BlobInfo.newBuilder(blobIdObj)
                    .setContentType(contentType != null ? contentType : "application/octet-stream")
                    .build();

            storage.create(blobInfo, content);
        } catch (Exception e) {
            throw new RuntimeException("Failed to replace file in GCS: " + storageKey, e);
        }
    }

    @Override
    public InputStream downloadFile(String storageKey) {
        try {
            BlobId blobId = BlobId.of(bucketName, storageKey);
            Blob blob = storage.get(blobId);

            if (blob == null) {
                throw new RuntimeException("File not found in GCS: " + storageKey);
            }

            byte[] content = blob.getContent();
            return new ByteArrayInputStream(content);
        } catch (Exception e) {
            throw new RuntimeException("Failed to download file from GCS: " + storageKey, e);
        }
    }

    @Override
    public void deleteFile(String storageKey) {
        try {
            BlobId blobId = BlobId.of(bucketName, storageKey);
            boolean deleted = storage.delete(blobId);

            if (!deleted) {
                log.warn("File not found for deletion in GCS: {}", storageKey);
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to delete file from GCS", e);
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

            // First, get folders (objects ending with /)
            com.google.api.gax.paging.Page<Blob> folderPage = storage.list(
                    bucketName,
                    Storage.BlobListOption.prefix(prefix),
                    Storage.BlobListOption.delimiter("/"));

            // Consume the folder page iterator - using while loop to avoid unused variable
            var folderIterator = folderPage.iterateAll().iterator();
            while (folderIterator.hasNext()) {
                folderIterator.next(); // Consume but don't store
            }

            // Use a different approach - list all objects and filter
            com.google.api.gax.paging.Page<Blob> allPage = storage.list(
                    bucketName,
                    Storage.BlobListOption.prefix(prefix));

            for (Blob blob : allPage.iterateAll()) {
                String blobName = blob.getName();

                // Skip the prefix itself
                if (blobName.equals(prefix))
                    continue;

                // Determine if it's a "folder" (ends with /)
                boolean isFolder = blobName.endsWith("/");

                if (isFolder) {
                    String folderName = blobName.substring(prefix.length(), blobName.length() - 1);
                    files.add(new CloudFile(
                            blobName,
                            folderName,
                            blobName,
                            0L,
                            null,
                            blob.getMetadata() != null && blob.getMetadata().get("updated") != null
                                    ? Instant.parse(blob.getMetadata().get("updated"))
                                    : Instant.now(),
                            ProviderType.GCS,
                            true,
                            blobName));
                } else {
                    String name = blobName.substring(prefix.length());
                    files.add(new CloudFile(
                            blobName,
                            name,
                            blobName,
                            blob.getSize(),
                            blob.getContentType(),
                            blob.getMetadata() != null && blob.getMetadata().get("updated") != null
                                    ? Instant.parse(blob.getMetadata().get("updated"))
                                    : Instant.now(),
                            ProviderType.GCS,
                            false,
                            blobName));
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to list files from GCS", e);
        }

        return files;
    }

    @Override
    public void createFolder(String path) {
        // In GCS, folders are created as empty objects with trailing /
        String folderPath = path.endsWith("/") ? path : path + "/";

        try {
            BlobId blobId = BlobId.of(bucketName, folderPath);
            BlobInfo blobInfo = BlobInfo.newBuilder(blobId)
                    .setContentType("application/x-directory")
                    .build();

            storage.create(blobInfo, new byte[0]);
        } catch (Exception e) {
            throw new RuntimeException("Failed to create folder in GCS", e);
        }
    }

    @Override
    public void deleteFolder(String path) {
        String prefix = path.endsWith("/") ? path : path + "/";

        try {
            com.google.api.gax.paging.Page<Blob> page = storage.list(
                    bucketName,
                    Storage.BlobListOption.prefix(prefix),
                    Storage.BlobListOption.versions(false));

            for (Blob blob : page.iterateAll()) {
                storage.delete(blob.getBlobId());
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to delete folder from GCS", e);
        }
    }

    @Override
    public CloudFile getFileMetadata(String storageKey) {
        try {
            BlobId blobId = BlobId.of(bucketName, storageKey);
            Blob blob = storage.get(blobId);

            if (blob == null) {
                return null;
            }

            String name = storageKey.substring(storageKey.lastIndexOf('/') + 1);

            return new CloudFile(
                    storageKey,
                    name,
                    storageKey,
                    blob.getSize(),
                    blob.getContentType(),
                    // Use getGeneratedId() as a proxy for creation time or fallback to now
                    Instant.now(),
                    ProviderType.GCS,
                    false,
                    storageKey);
        } catch (Exception e) {
            return null;
        }
    }

    @Override
    public String getFileUrl(String storageKey) {
        return "https://storage.googleapis.com/" + bucketName + "/" + storageKey;
    }

    private String buildObjectName(String fileName) {
        String safeName = fileName.replace("\\", "_")
                .replace("/", "_")
                .replaceAll("\\s+", "_");
        return "user-files/" + System.currentTimeMillis() + "_" + safeName;
    }
}