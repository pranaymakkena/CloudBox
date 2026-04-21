package com.cloudbox.storage;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.HeadBucketRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.net.URI;

/**
 * Per-user MinIO adapter using the AWS SDK (S3-compatible endpoint).
 * This avoids relying on the globally configured MinIO bean when users
 * provide their own MinIO endpoint/bucket/credentials.
 */
public class MinioS3CompatibleAdapter implements CloudStorageAdapter {

    private static final Logger log = LoggerFactory.getLogger(MinioS3CompatibleAdapter.class);

    private S3Client s3Client;
    private String bucketName;
    private String endpoint;
    private String region;

    public void configure(String accessKey, String secretKey, String bucket, String region, String endpoint) {
        this.bucketName = bucket;
        this.endpoint = endpoint;
        this.region = (region == null || region.isBlank()) ? "us-east-1" : region;

        this.s3Client = S3Client.builder()
                .endpointOverride(URI.create(endpoint))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(accessKey, secretKey)))
                .region(Region.of(this.region))
                .forcePathStyle(true)
                .build();

        log.info("MinIO (S3-compatible) adapter configured for endpoint {}", endpoint);
    }

    @Override
    public ProviderType getProviderType() {
        return ProviderType.MINIO;
    }

    @Override
    public String getProviderName() {
        return "MinIO (S3-compatible)";
    }

    @Override
    public boolean testConnection() {
        validateConfigured();
        try {
            s3Client.headBucket(HeadBucketRequest.builder().bucket(bucketName).build());
            return true;
        } catch (S3Exception e) {
            return false;
        }
    }

    @Override
    public String uploadFile(InputStream content, long size, String fileName, String contentType) {
        validateConfigured();
        String key = buildObjectKey(fileName);
        s3Client.putObject(
                PutObjectRequest.builder()
                        .bucket(bucketName)
                        .key(key)
                        .contentType(contentType != null ? contentType : "application/octet-stream")
                        .build(),
                RequestBody.fromInputStream(content, size));
        return key;
    }

    @Override
    public InputStream downloadFile(String storageKey) {
        validateConfigured();
        return s3Client.getObject(b -> b.bucket(bucketName).key(storageKey));
    }

    @Override
    public void deleteFile(String storageKey) {
        validateConfigured();
        s3Client.deleteObject(b -> b.bucket(bucketName).key(storageKey));
    }

    @Override
    public void replaceFile(String storageKey, byte[] content, String contentType) {
        validateConfigured();
        s3Client.putObject(
                PutObjectRequest.builder()
                        .bucket(bucketName)
                        .key(storageKey)
                        .contentType(contentType != null ? contentType : "application/octet-stream")
                        .build(),
                RequestBody.fromInputStream(new ByteArrayInputStream(content), content.length));
    }

    @Override
    public java.util.List<CloudFile> listFiles(String path) {
        throw new UnsupportedOperationException("listFiles not implemented for MinioS3CompatibleAdapter");
    }

    @Override
    public String getFileUrl(String storageKey) {
        validateConfigured();
        // Typical MinIO URL pattern
        return endpoint + "/" + bucketName + "/" + storageKey;
    }

    private void validateConfigured() {
        if (s3Client == null) {
            throw new IllegalStateException("MinIO adapter not configured");
        }
        if (bucketName == null || bucketName.isBlank()) {
            throw new IllegalStateException("MinIO bucket not configured");
        }
    }

    private String buildObjectKey(String fileName) {
        String safeName = (fileName == null ? "file" : fileName)
                .replace("\\", "_")
                .replace("/", "_")
                .replaceAll("\\s+", "_");
        return System.currentTimeMillis() + "_" + safeName;
    }
}
