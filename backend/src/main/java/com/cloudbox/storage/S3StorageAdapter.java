package com.cloudbox.storage;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.net.URI;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * AWS S3 storage adapter implementing the CloudStorageAdapter interface.
 * Supports both AWS S3 and any S3-compatible storage (MinIO, Wasabi, etc.)
 */
@Component
public class S3StorageAdapter implements CloudStorageAdapter {

    private static final Logger log = LoggerFactory.getLogger(S3StorageAdapter.class);

    private S3Client s3Client;
    private String bucketName;
    private String region;
    private String endpoint; // For S3-compatible services

    public S3StorageAdapter() {
        this.s3Client = null;
        this.bucketName = null;
        this.region = null;
        this.endpoint = null;
    }

    /**
     * Configure the S3 adapter with AWS credentials.
     */
    public void configure(String accessKey, String secretKey, String bucket, String region) {
        this.bucketName = bucket;
        this.region = region;
        this.endpoint = null; // Explicitly set to null for AWS S3

        this.s3Client = S3Client.builder()
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(accessKey, secretKey)))
                .region(Region.of(region))
                .build();

        log.info("S3 Storage Adapter configured for bucket: {}", bucket);
    }

    /**
     * Configure the S3 adapter with custom endpoint (S3-compatible).
     */
    public void configure(String accessKey, String secretKey, String bucket,
            String region, String endpoint) {
        this.bucketName = bucket;
        this.region = region;
        this.endpoint = endpoint;

        this.s3Client = S3Client.builder()
                .endpointOverride(URI.create(endpoint))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(accessKey, secretKey)))
                .region(Region.of(region))
                .forcePathStyle(true) // Required for S3-compatible services
                .build();

        log.info("S3 Storage Adapter configured for endpoint: {}", endpoint);
    }

    @Override
    public ProviderType getProviderType() {
        return ProviderType.AWS_S3;
    }

    @Override
    public String getProviderName() {
        return "Amazon S3";
    }

    @Override
    public boolean testConnection() {
        validateConfiguration();
        try {
            s3Client.headBucket(HeadBucketRequest.builder().bucket(bucketName).build());
            return true;
        } catch (S3Exception e) {
            log.error("S3 connection test failed: {}", e.awsErrorDetails().errorMessage());
            return false;
        }
    }

    @Override
    public String uploadFile(InputStream content, long size, String fileName, String contentType) {
        validateConfiguration();
        if (content == null) {
            throw new IllegalArgumentException("InputStream content cannot be null");
        }
        if (fileName == null || fileName.isEmpty()) {
            throw new IllegalArgumentException("File name cannot be null or empty");
        }
        String key = buildObjectKey(fileName);

        try {
            PutObjectRequest request = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .contentType(contentType != null ? contentType : "application/octet-stream")
                    .build();

            s3Client.putObject(request, RequestBody.fromInputStream(content, size));
            return key;
        } catch (S3Exception e) {
            throw new RuntimeException("Failed to upload file to S3: " + e.awsErrorDetails().errorMessage(), e);
        }
    }

    @Override
    public void replaceFile(String storageKey, byte[] content, String contentType) {
        validateConfiguration();
        if (storageKey == null || storageKey.isEmpty()) {
            throw new IllegalArgumentException("Storage key cannot be null or empty");
        }
        try {
            PutObjectRequest request = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(storageKey)
                    .contentType(contentType != null ? contentType : "application/octet-stream")
                    .build();

            s3Client.putObject(request, RequestBody.fromInputStream(
                    new ByteArrayInputStream(content), content.length));
        } catch (S3Exception e) {
            throw new RuntimeException("Failed to replace file in S3: " + storageKey, e);
        }
    }

    @Override
    public InputStream downloadFile(String storageKey) {
        validateConfiguration();
        if (storageKey == null || storageKey.isEmpty()) {
            throw new IllegalArgumentException("Storage key cannot be null or empty");
        }
        try {
            GetObjectRequest request = GetObjectRequest.builder()
                    .bucket(bucketName)
                    .key(storageKey)
                    .build();

            return s3Client.getObject(request);
        } catch (S3Exception e) {
            throw new RuntimeException("Failed to download file from S3: " + storageKey, e);
        }
    }

    @Override
    public void deleteFile(String storageKey) {
        validateConfiguration();
        if (storageKey == null || storageKey.isEmpty()) {
            throw new IllegalArgumentException("Storage key cannot be null or empty");
        }
        try {
            s3Client.deleteObject(DeleteObjectRequest.builder()
                    .bucket(bucketName)
                    .key(storageKey)
                    .build());
        } catch (S3Exception e) {
            throw new RuntimeException("Failed to delete file from S3: " + storageKey, e);
        }
    }

    @Override
    public List<CloudFile> listFiles(String path) {
        validateConfiguration();
        List<CloudFile> files = new ArrayList<>();

        try {
            String prefix = (path == null || path.isEmpty()) ? "" : path;
            if (!prefix.isEmpty() && !prefix.endsWith("/")) {
                prefix = prefix + "/";
            }

            ListObjectsV2Response response = s3Client.listObjectsV2(
                    ListObjectsV2Request.builder()
                            .bucket(bucketName)
                            .prefix(prefix)
                            .delimiter("/")
                            .build());

            // Add folders (common prefixes)
            if (response.commonPrefixes() != null) {
                for (software.amazon.awssdk.services.s3.model.CommonPrefix commonPrefix : response.commonPrefixes()) {
                    String prefixStr = commonPrefix.prefix();
                    String folderName = prefixStr.substring(prefix.length(), prefixStr.length() - 1);
                    files.add(new CloudFile(
                            prefixStr,
                            folderName,
                            prefixStr,
                            0L,
                            null,
                            Instant.now(),
                            ProviderType.AWS_S3,
                            true,
                            prefixStr));
                }
            }

            // Add files
            if (response.contents() != null) {
                for (S3Object obj : response.contents()) {
                    if (obj.key().equals(prefix))
                        continue; // Skip the prefix itself

                    String name = obj.key().substring(prefix.length());
                    files.add(new CloudFile(
                            obj.key(),
                            name,
                            obj.key(),
                            obj.size(),
                            null, // Content type not available in listObjects response
                            obj.lastModified(),
                            ProviderType.AWS_S3,
                            false,
                            obj.key()));
                }
            }
        } catch (S3Exception e) {
            throw new RuntimeException("Failed to list files from S3", e);
        }

        return files;
    }

    @Override
    public void createFolder(String path) {
        validateConfiguration();
        if (path == null || path.isEmpty()) {
            throw new IllegalArgumentException("Folder path cannot be null or empty");
        }
        // In S3, folders are created as empty objects with trailing /
        String folderKey = path.endsWith("/") ? path : path + "/";

        try {
            s3Client.putObject(PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(folderKey)
                    .build(),
                    RequestBody.fromBytes(new byte[0]));
        } catch (S3Exception e) {
            throw new RuntimeException("Failed to create folder in S3", e);
        }
    }

    @Override
    public void deleteFolder(String path) {
        validateConfiguration();
        if (path == null || path.isEmpty()) {
            throw new IllegalArgumentException("Folder path cannot be null or empty");
        }
        String prefix = path.endsWith("/") ? path : path + "/";

        try {
            // List and delete all objects with this prefix
            ListObjectsV2Response response = s3Client.listObjectsV2(
                    ListObjectsV2Request.builder()
                            .bucket(bucketName)
                            .prefix(prefix)
                            .build());

            for (S3Object obj : response.contents()) {
                s3Client.deleteObject(DeleteObjectRequest.builder()
                        .bucket(bucketName)
                        .key(obj.key())
                        .build());
            }
        } catch (S3Exception e) {
            throw new RuntimeException("Failed to delete folder from S3", e);
        }
    }

    @Override
    public CloudFile getFileMetadata(String storageKey) {
        validateConfiguration();
        if (storageKey == null || storageKey.isEmpty()) {
            throw new IllegalArgumentException("Storage key cannot be null or empty");
        }
        try {
            HeadObjectResponse response = s3Client.headObject(HeadObjectRequest.builder()
                    .bucket(bucketName)
                    .key(storageKey)
                    .build());

            String name = storageKey.substring(storageKey.lastIndexOf('/') + 1);

            return new CloudFile(
                    storageKey,
                    name,
                    storageKey,
                    response.contentLength(),
                    response.contentType(),
                    response.lastModified(),
                    ProviderType.AWS_S3,
                    false,
                    storageKey);
        } catch (NoSuchKeyException e) {
            return null;
        } catch (S3Exception e) {
            throw new RuntimeException("Failed to get file metadata from S3", e);
        }
    }

    @Override
    public String getFileUrl(String storageKey) {
        validateConfiguration();
        if (storageKey == null || storageKey.isEmpty()) {
            throw new IllegalArgumentException("Storage key cannot be null or empty");
        }
        // For S3, you'd typically generate a presigned URL
        // This returns the base URL pattern
        if (endpoint != null) {
            return endpoint + "/" + bucketName + "/" + storageKey;
        }
        return "https://" + bucketName + ".s3." + region + ".amazonaws.com/" + storageKey;
    }

    private String buildObjectKey(String fileName) {
        String safeName = fileName.replace("\\", "_")
                .replace("/", "_")
                .replaceAll("\\s+", "_");
        return System.currentTimeMillis() + "_" + safeName;
    }

    /**
     * Validates that the S3 client has been configured before use.
     * 
     * @throws IllegalStateException if not configured
     */
    private void validateConfiguration() {
        if (s3Client == null) {
            throw new IllegalStateException("S3StorageAdapter has not been configured. Call configure() first.");
        }
        if (bucketName == null || bucketName.isEmpty()) {
            throw new IllegalStateException("Bucket name not configured. Call configure() first.");
        }
    }
}