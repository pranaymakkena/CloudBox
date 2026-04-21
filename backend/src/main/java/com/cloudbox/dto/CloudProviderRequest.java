package com.cloudbox.dto;

import com.cloudbox.storage.ProviderType;
import jakarta.validation.constraints.NotNull;

/**
 * Request DTO for adding a new cloud provider configuration.
 */
public class CloudProviderRequest {

    @NotNull(message = "Provider type is required")
    private ProviderType providerType;

    private String providerName;

    // AWS S3
    private String accessKey;
    private String secretKey;
    private String bucket;
    private String region;
    private String endpoint;  // For S3-compatible services

    // Google Cloud Storage
    private String projectId;
    private String jsonKeyPath;
    private String jsonCredentials;  // JSON string instead of file path

    // Azure Blob Storage
    private String connectionString;
    private String accountName;
    private String accountKey;
    private String containerName;

    // Local storage
    private String uploadDir;

    // Common
    private boolean setAsDefault = false;

    // Getters and Setters

    public ProviderType getProviderType() { return providerType; }
    public void setProviderType(ProviderType providerType) { this.providerType = providerType; }

    public String getProviderName() { return providerName; }
    public void setProviderName(String providerName) { this.providerName = providerName; }

    public String getAccessKey() { return accessKey; }
    public void setAccessKey(String accessKey) { this.accessKey = accessKey; }

    public String getSecretKey() { return secretKey; }
    public void setSecretKey(String secretKey) { this.secretKey = secretKey; }

    public String getBucket() { return bucket; }
    public void setBucket(String bucket) { this.bucket = bucket; }

    public String getRegion() { return region; }
    public void setRegion(String region) { this.region = region; }

    public String getEndpoint() { return endpoint; }
    public void setEndpoint(String endpoint) { this.endpoint = endpoint; }

    public String getProjectId() { return projectId; }
    public void setProjectId(String projectId) { this.projectId = projectId; }

    public String getJsonKeyPath() { return jsonKeyPath; }
    public void setJsonKeyPath(String jsonKeyPath) { this.jsonKeyPath = jsonKeyPath; }

    public String getJsonCredentials() { return jsonCredentials; }
    public void setJsonCredentials(String jsonCredentials) { this.jsonCredentials = jsonCredentials; }

    public String getConnectionString() { return connectionString; }
    public void setConnectionString(String connectionString) { this.connectionString = connectionString; }

    public String getAccountName() { return accountName; }
    public void setAccountName(String accountName) { this.accountName = accountName; }

    public String getAccountKey() { return accountKey; }
    public void setAccountKey(String accountKey) { this.accountKey = accountKey; }

    public String getContainerName() { return containerName; }
    public void setContainerName(String containerName) { this.containerName = containerName; }

    public String getUploadDir() { return uploadDir; }
    public void setUploadDir(String uploadDir) { this.uploadDir = uploadDir; }

    public boolean isSetAsDefault() { return setAsDefault; }
    public void setSetAsDefault(boolean setAsDefault) { this.setAsDefault = setAsDefault; }
}