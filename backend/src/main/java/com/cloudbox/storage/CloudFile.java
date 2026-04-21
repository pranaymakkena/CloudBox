package com.cloudbox.storage;

import java.time.Instant;

/**
 * Unified file model representing a file across all cloud providers.
 */
public record CloudFile(
        String id,
        String name,
        String path,
        long size,
        String contentType,
        Instant lastModified,
        ProviderType provider,
        boolean isFolder,
        String storageKey) {
    public static CloudFile fromAdapter(com.cloudbox.service.MinioStorageAdapter.StoredFile stored,
            ProviderType provider, String path) {
        return new CloudFile(
                stored.storageKey(),
                extractFileName(stored.storageKey()),
                path + "/" + stored.storageKey(),
                0L,
                null,
                Instant.now(),
                provider,
                false,
                stored.storageKey());
    }

    private static String extractFileName(String storageKey) {
        if (storageKey == null)
            return "unknown";
        int lastSlash = storageKey.lastIndexOf('/');
        return lastSlash >= 0 ? storageKey.substring(lastSlash + 1) : storageKey;
    }
}