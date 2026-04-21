package com.cloudbox.dto;

import com.cloudbox.storage.ProviderType;
import java.time.LocalDateTime;

/**
 * Response DTO for cloud provider information.
 */
public class CloudProviderResponse {

    private Long id;
    private ProviderType providerType;
    private String providerName;
    private boolean active;
    private boolean isDefault;
    private boolean connected;
    private LocalDateTime lastSyncAt;
    private LocalDateTime createdAt;

    // Non-sensitive info only
    private String region;        // For S3
    private String bucket;        // For S3/GCS
    private String containerName; // For Azure

    // Constructors

    public CloudProviderResponse() {}

    // Getters and Setters

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public ProviderType getProviderType() { return providerType; }
    public void setProviderType(ProviderType providerType) { this.providerType = providerType; }

    public String getProviderName() { return providerName; }
    public void setProviderName(String providerName) { this.providerName = providerName; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public boolean isDefault() { return isDefault; }
    public void setDefault(boolean isDefault) { this.isDefault = isDefault; }

    public boolean isConnected() { return connected; }
    public void setConnected(boolean connected) { this.connected = connected; }

    public LocalDateTime getLastSyncAt() { return lastSyncAt; }
    public void setLastSyncAt(LocalDateTime lastSyncAt) { this.lastSyncAt = lastSyncAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public String getRegion() { return region; }
    public void setRegion(String region) { this.region = region; }

    public String getBucket() { return bucket; }
    public void setBucket(String bucket) { this.bucket = bucket; }

    public String getContainerName() { return containerName; }
    public void setContainerName(String containerName) { this.containerName = containerName; }
}