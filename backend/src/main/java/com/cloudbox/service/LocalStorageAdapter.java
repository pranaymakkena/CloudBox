package com.cloudbox.service;

import com.cloudbox.storage.CloudFile;
import com.cloudbox.storage.CloudStorageAdapter;
import com.cloudbox.storage.ProviderType;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.StandardOpenOption;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Stream;

/**
 * Local filesystem storage adapter implementing the CloudStorageAdapter
 * interface.
 * Used as a fallback when cloud storage is not configured.
 */
@Component
public class LocalStorageAdapter implements CloudStorageAdapter {

    @Value("${storage.upload-dir:uploads/}")
    private String uploadDir;

    public LocalStorageAdapter() {
    }

    public LocalStorageAdapter(String uploadDir) {
        this.uploadDir = uploadDir;
    }

    @Override
    public ProviderType getProviderType() {
        return ProviderType.LOCAL;
    }

    @Override
    public String getProviderName() {
        return "Local Storage";
    }

    @Override
    public boolean testConnection() {
        try {
            Path dir = Paths.get(uploadDir);
            Files.createDirectories(dir);
            return Files.isWritable(dir);
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public String uploadFile(InputStream content, long size, String fileName, String contentType) {
        try {
            String uniqueName = UUID.randomUUID() + "_" + sanitize(fileName);
            Path dir = Paths.get(uploadDir);
            Files.createDirectories(dir);
            Path dest = dir.resolve(uniqueName);
            Files.copy(content, dest, StandardCopyOption.REPLACE_EXISTING);
            return uniqueName;
        } catch (IOException e) {
            throw new RuntimeException("Failed to upload file to local storage", e);
        }
    }

    @Override
    public InputStream downloadFile(String storageKey) {
        try {
            Path path = Paths.get(uploadDir).resolve(storageKey);
            if (!Files.exists(path)) {
                throw new RuntimeException("File not found: " + storageKey);
            }
            return Files.newInputStream(path);
        } catch (IOException e) {
            throw new RuntimeException("Failed to download file from local storage", e);
        }
    }

    @Override
    public void replaceFile(String storageKey, byte[] content, String contentType) {
        try {
            Path path = Paths.get(uploadDir).resolve(storageKey);
            Files.createDirectories(path.getParent());
            Files.write(path, content, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
        } catch (IOException e) {
            throw new RuntimeException("Failed to replace file in local storage: " + storageKey, e);
        }
    }

    @Override
    public void deleteFile(String storageKey) {
        try {
            Path path = Paths.get(uploadDir).resolve(storageKey);
            Files.deleteIfExists(path);
        } catch (IOException e) {
            throw new RuntimeException("Failed to delete file from local storage", e);
        }
    }

    @Override
    public List<CloudFile> listFiles(String path) {
        List<CloudFile> files = new ArrayList<>();

        try {
            Path dir = Paths.get(uploadDir).resolve(path != null ? path : "");
            if (!Files.exists(dir)) {
                return files;
            }

            try (Stream<Path> paths = Files.list(dir)) {
                for (Path p : paths.toList()) {
                    String name = p.getFileName().toString();
                    boolean isFolder = Files.isDirectory(p);

                    files.add(new CloudFile(
                            p.toString(),
                            name,
                            path != null ? path + "/" + name : name,
                            isFolder ? 0L : Files.size(p),
                            isFolder ? null : Files.probeContentType(p),
                            Files.getLastModifiedTime(p).toInstant(),
                            ProviderType.LOCAL,
                            isFolder,
                            isFolder ? name : p.toString()));
                }
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to list files from local storage", e);
        }

        return files;
    }

    @Override
    public void createFolder(String path) {
        try {
            Path dir = Paths.get(uploadDir).resolve(path);
            Files.createDirectories(dir);
        } catch (IOException e) {
            throw new RuntimeException("Failed to create folder in local storage", e);
        }
    }

    @Override
    public void deleteFolder(String path) {
        try {
            Path dir = Paths.get(uploadDir).resolve(path);
            if (Files.exists(dir)) {
                // Delete all contents first
                try (Stream<Path> paths = Files.walk(dir)) {
                    paths.sorted((a, b) -> b.compareTo(a))
                            .forEach(p -> {
                                try {
                                    Files.deleteIfExists(p);
                                } catch (IOException ignored) {
                                }
                            });
                }
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to delete folder from local storage", e);
        }
    }

    @Override
    public CloudFile getFileMetadata(String storageKey) {
        try {
            Path path = Paths.get(uploadDir).resolve(storageKey);
            if (!Files.exists(path)) {
                return null;
            }

            String name = path.getFileName().toString();

            return new CloudFile(
                    storageKey,
                    name,
                    storageKey,
                    Files.size(path),
                    Files.probeContentType(path),
                    Files.getLastModifiedTime(path).toInstant(),
                    ProviderType.LOCAL,
                    Files.isDirectory(path),
                    storageKey);
        } catch (Exception e) {
            return null;
        }
    }

    @Override
    public String getFileUrl(String storageKey) {
        return "/api/files/stream/" + storageKey;
    }

    private String sanitize(String name) {
        if (name == null)
            return "file";
        return name.replaceAll("[^a-zA-Z0-9._-]", "_");
    }
}