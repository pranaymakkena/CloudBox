package com.cloudbox.service;

import com.cloudbox.storage.CloudFile;
import com.cloudbox.storage.CloudStorageAdapter;
import com.cloudbox.storage.ProviderType;
import io.minio.BucketExistsArgs;
import io.minio.GetObjectArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import io.minio.errors.ErrorResponseException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriUtils;

import java.io.InputStream;
import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/**
 * MinIO storage adapter implementing the CloudStorageAdapter interface.
 * MinIO is S3-compatible and serves as the default storage provider.
 */
@Component
public class MinioStorageAdapter implements CloudStorageAdapter {

    private final MinioClient minioClient;
    private final String bucketName;
    private final String minioUrl;

    public MinioStorageAdapter(
            MinioClient minioClient,
            @Value("${minio.bucket-name}") String bucketName,
            @Value("${minio.url}") String minioUrl) {
        this.minioClient = minioClient;
        this.bucketName = bucketName;
        this.minioUrl = minioUrl;
    }

    @Override
    public ProviderType getProviderType() {
        return ProviderType.MINIO;
    }

    @Override
    public String getProviderName() {
        return "MinIO Server";
    }

    @Override
    public boolean testConnection() {
        try {
            return minioClient.bucketExists(
                    BucketExistsArgs.builder().bucket(bucketName).build());
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public String uploadFile(InputStream content, long size, String fileName, String contentType) {
        String objectName = buildObjectName(fileName);

        try {
            ensureBucketExists();

            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectName)
                            .stream(content, size, -1)
                            .contentType(defaultContentType(contentType))
                            .build());

            return objectName;
        } catch (Exception ex) {
            throw new RuntimeException("Failed to upload file to MinIO", ex);
        }
    }

    @Override
    public InputStream downloadFile(String storageKey) {
        try {
            return minioClient.getObject(
                    GetObjectArgs.builder()
                            .bucket(bucketName)
                            .object(storageKey)
                            .build());
        } catch (Exception ex) {
            throw new RuntimeException("Failed to download file from MinIO: " + storageKey, ex);
        }
    }

    @Override
    public void replaceFile(String storageKey, byte[] content, String contentType) {
        try {
            ensureBucketExists();
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucketName)
                            .object(storageKey)
                            .stream(new ByteArrayInputStream(content), content.length, -1)
                            .contentType(defaultContentType(contentType))
                            .build());
        } catch (Exception ex) {
            throw new RuntimeException("Failed to replace file in MinIO: " + storageKey, ex);
        }
    }

    @Override
    public void deleteFile(String storageKey) {
        try {
            minioClient.removeObject(
                    RemoveObjectArgs.builder()
                            .bucket(bucketName)
                            .object(storageKey)
                            .build());
        } catch (ErrorResponseException ex) {
            if (ex.errorResponse() != null && "NoSuchKey".equals(ex.errorResponse().code())) {
                return; // Already deleted
            }
            throw new RuntimeException("Failed to delete file from MinIO", ex);
        } catch (Exception ex) {
            throw new RuntimeException("Failed to delete file from MinIO", ex);
        }
    }

    @Override
    public List<CloudFile> listFiles(String path) {
        List<CloudFile> files = new ArrayList<>();

        try {
            // MinIO doesn't have native folder support, we list with prefix
            String prefix = (path == null || path.isEmpty()) ? "" : path;
            if (!prefix.isEmpty() && !prefix.endsWith("/")) {
                prefix = prefix + "/";
            }

            Iterable<io.minio.Result<io.minio.messages.Item>> results = minioClient.listObjects(
                    io.minio.ListObjectsArgs.builder()
                            .bucket(bucketName)
                            .prefix(prefix)
                            .recursive(false)
                            .build());

            for (io.minio.Result<io.minio.messages.Item> result : results) {
                io.minio.messages.Item item = result.get();
                String itemName = item.objectName();
                // Skip the prefix itself
                if (itemName.equals(prefix))
                    continue;

                // Determine if it's a "folder" (ends with /) or file
                boolean isFolder = itemName.endsWith("/");
                String name = isFolder
                        ? itemName.substring(prefix.length(), itemName.length() - 1)
                        : itemName.substring(prefix.length());

                long size = 0L;
                try {
                    size = item.size();
                } catch (Exception ignored) {
                }

                files.add(new CloudFile(
                        itemName,
                        name,
                        itemName,
                        size,
                        null,
                        Instant.now(),
                        ProviderType.MINIO,
                        isFolder,
                        itemName));
            }
        } catch (Exception ex) {
            throw new RuntimeException("Failed to list files from MinIO", ex);
        }

        return files;
    }

    @Override
    public void createFolder(String path) {
        try {
            // In MinIO, folders are created as empty objects with trailing /
            String folderPath = path.endsWith("/") ? path : path + "/";
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucketName)
                            .object(folderPath)
                            .stream(new java.io.ByteArrayInputStream(new byte[0]), 0, -1)
                            .contentType("application/x-directory")
                            .build());
        } catch (Exception ex) {
            throw new RuntimeException("Failed to create folder in MinIO", ex);
        }
    }

    @Override
    public void deleteFolder(String path) {
        try {
            String prefix = path.endsWith("/") ? path : path + "/";

            // Delete all objects with this prefix
            Iterable<io.minio.Result<io.minio.messages.Item>> results = minioClient.listObjects(
                    io.minio.ListObjectsArgs.builder()
                            .bucket(bucketName)
                            .prefix(prefix)
                            .recursive(true)
                            .build());

            for (io.minio.Result<io.minio.messages.Item> result : results) {
                io.minio.messages.Item item = result.get();
                minioClient.removeObject(
                        RemoveObjectArgs.builder()
                                .bucket(bucketName)
                                .object(item.objectName())
                                .build());
            }
        } catch (Exception ex) {
            throw new RuntimeException("Failed to delete folder from MinIO", ex);
        }
    }

    @Override
    public CloudFile getFileMetadata(String storageKey) {
        try {
            var statResponse = minioClient.statObject(
                    io.minio.StatObjectArgs.builder()
                            .bucket(bucketName)
                            .object(storageKey)
                            .build());

            String name = storageKey.substring(storageKey.lastIndexOf('/') + 1);

            long size = 0L;
            try {
                size = statResponse.size();
            } catch (Exception ignored) {
            }

            return new CloudFile(
                    storageKey,
                    name,
                    storageKey,
                    size,
                    statResponse.contentType(),
                    statResponse.lastModified().toInstant(),
                    ProviderType.MINIO,
                    false,
                    storageKey);
        } catch (Exception ex) {
            return null;
        }
    }

    @Override
    public String getFileUrl(String storageKey) {
        String encodedFileName = UriUtils.encodePathSegment(storageKey, StandardCharsets.UTF_8);
        return minioUrl + "/" + bucketName + "/" + encodedFileName;
    }

    // Helper methods

    private void ensureBucketExists() throws Exception {
        boolean bucketExists = minioClient.bucketExists(
                BucketExistsArgs.builder().bucket(bucketName).build());

        if (!bucketExists) {
            minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucketName).build());
            setPublicReadPolicy();
        }
    }

    private void setPublicReadPolicy() {
        try {
            String policy = "{"
                    + "\"Version\":\"2012-10-17\","
                    + "\"Statement\":[{"
                    + "\"Effect\":\"Allow\","
                    + "\"Principal\":{\"AWS\":[\"*\"]},"
                    + "\"Action\":[\"s3:GetObject\"],"
                    + "\"Resource\":[\"arn:aws:s3:::" + bucketName + "/*\"]"
                    + "}]"
                    + "}";
            minioClient.setBucketPolicy(
                    io.minio.SetBucketPolicyArgs.builder()
                            .bucket(bucketName)
                            .config(policy)
                            .build());
        } catch (Exception ignored) {
            // Policy may already be set or not supported
        }
    }

    private String buildObjectName(String originalFilename) {
        String safeName = Objects.requireNonNullElse(originalFilename, "file")
                .replace("\\", "_")
                .replace("/", "_")
                .replaceAll("\\s+", "_");
        return System.currentTimeMillis() + "_" + safeName;
    }

    private String defaultContentType(String contentType) {
        return (contentType == null || contentType.isBlank())
                ? "application/octet-stream"
                : contentType;
    }

    // Record for internal use
    public record StoredFile(String storageKey, String fileUrl) {
    }
}