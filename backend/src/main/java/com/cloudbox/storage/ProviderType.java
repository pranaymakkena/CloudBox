package com.cloudbox.storage;

/**
 * Enum representing supported cloud storage providers.
 */
public enum ProviderType {
    LOCAL("Local Storage"),
    MINIO("MinIO Server"),
    AWS_S3("Amazon S3"),
    GCS("Google Cloud Storage"),
    AZURE_BLOB("Azure Blob Storage"),
    DROPBOX("Dropbox"),
    ONEDRIVE("OneDrive");

    private final String displayName;

    ProviderType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}