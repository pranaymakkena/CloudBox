package com.cloudbox.storage;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.util.List;

/**
 * Interface for cloud storage adapters.
 * Each cloud provider (S3, GCS, Azure, MinIO, etc.) implements this interface.
 */
public interface CloudStorageAdapter {

    /**
     * Returns the type of this storage provider.
     */
    ProviderType getProviderType();

    /**
     * Returns a human-readable name for this provider.
     */
    String getProviderName();

    /**
     * Tests the connection to the cloud provider.
     * 
     * @return true if connection is successful, false otherwise
     */
    boolean testConnection();

    /**
     * Uploads a file to the cloud storage.
     * 
     * @param content     InputStream of the file content
     * @param size        Size of the file in bytes
     * @param fileName    Original file name
     * @param contentType MIME type of the file
     * @return Storage key/path that identifies the file in this provider
     */
    String uploadFile(InputStream content, long size, String fileName, String contentType);

    /**
     * Downloads a file from cloud storage.
     * 
     * @param storageKey The key/path returned by uploadFile
     * @return InputStream of the file content
     */
    InputStream downloadFile(String storageKey);

    /**
     * Deletes a file from cloud storage.
     * 
     * @param storageKey The key/path of the file to delete
     */
    void deleteFile(String storageKey);

    /**
     * Read a file fully into memory.
     * Useful for preview/edit flows where the API needs raw bytes.
     */
    default byte[] getFileBytes(String storageKey) {
        try (InputStream in = downloadFile(storageKey)) {
            return in.readAllBytes();
        } catch (Exception e) {
            throw new RuntimeException("Failed to read file bytes: " + storageKey, e);
        }
    }

    /**
     * Replace file contents at the same storage key.
     * Providers should override for efficient overwrite semantics.
     */
    default void replaceFile(String storageKey, byte[] content, String contentType) {
        deleteFile(storageKey);
        uploadFile(new ByteArrayInputStream(content), content.length, storageKey, contentType);
    }

    /**
     * Lists files in a directory.
     * 
     * @param path Directory path (prefix for S3-style, folder path for others)
     * @return List of CloudFile objects
     */
    List<CloudFile> listFiles(String path);

    /**
     * Creates a folder/directory.
     * 
     * @param path Path of the folder to create
     */
    default void createFolder(String path) {
        // Default implementation: no-op for providers that don't need explicit folder
        // creation
    }

    /**
     * Deletes a folder/directory.
     * 
     * @param path Path of the folder to delete
     */
    default void deleteFolder(String path) {
        // Default implementation: delete all files in folder then folder
        List<CloudFile> files = listFiles(path);
        for (CloudFile file : files) {
            if (file.isFolder()) {
                deleteFolder(file.storageKey());
            } else {
                deleteFile(file.storageKey());
            }
        }
    }

    /**
     * Gets metadata for a specific file.
     * 
     * @param storageKey The key/path of the file
     * @return CloudFile with metadata
     */
    default CloudFile getFileMetadata(String storageKey) {
        List<CloudFile> files = listFiles("");
        return files.stream()
                .filter(f -> f.storageKey().equals(storageKey))
                .findFirst()
                .orElse(null);
    }

    /**
     * Generates a URL for accessing a file directly.
     * 
     * @param storageKey The key/path of the file
     * @return Public/presigned URL if available, null otherwise
     */
    default String getFileUrl(String storageKey) {
        return null;
    }
}