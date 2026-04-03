package com.cloudbox.service;

import org.springframework.stereotype.Service;
import java.util.*;

@Service
public class PermissionValidatorService {

    // File types that support editing
    private static final Set<String> EDITABLE_EXTENSIONS = Set.of(
            "txt", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "csv");

    // File types that do NOT support editing (read-only)
    private static final Set<String> READONLY_EXTENSIONS = Set.of(
            "pdf", "jpg", "jpeg", "png", "gif", "webp",
            "mp4", "mkv", "avi", "mov", "webm",
            "mp3", "wav", "ogg", "flac", "aac");

    /**
     * Get allowed permissions based on file extension
     */
    public List<String> getAllowedPermissions(String fileName) {
        String extension = getFileExtension(fileName).toLowerCase();
        List<String> permissions = new ArrayList<>();

        permissions.add("VIEW");
        permissions.add("DOWNLOAD");

        if (isEditableFile(extension)) {
            permissions.add("EDIT");
        }

        return permissions;
    }

    /**
     * Get allowed permissions based on MIME type
     */
    public List<String> getAllowedPermissionsByMimeType(String mimeType) {
        if (mimeType == null || mimeType.isBlank()) {
            return List.of("VIEW", "DOWNLOAD");
        }

        List<String> permissions = new ArrayList<>();
        permissions.add("VIEW");
        permissions.add("DOWNLOAD");

        String type = mimeType.toLowerCase();

        // Allow EDIT for office/document types
        if (type.contains("word") || type.contains("document") ||
                type.contains("spreadsheet") || type.contains("sheet") ||
                type.contains("presentation") || type.contains("text") ||
                type.contains("plain")) {
            permissions.add("EDIT");
        }

        return permissions;
    }

    /**
     * Validate if a permission is allowed for a given file
     */
    public boolean isPermissionAllowed(String fileName, String permission) {
        if (permission == null || permission.isBlank()) {
            return false;
        }

        List<String> allowedPermissions = getAllowedPermissions(fileName);
        return allowedPermissions.contains(permission.toUpperCase());
    }

    /**
     * Validate if a permission is allowed for a given MIME type
     */
    public boolean isPermissionAllowedByMimeType(String mimeType, String permission) {
        if (permission == null || permission.isBlank()) {
            return false;
        }

        List<String> allowedPermissions = getAllowedPermissionsByMimeType(mimeType);
        return allowedPermissions.contains(permission.toUpperCase());
    }

    /**
     * Get file extension from file name
     */
    private String getFileExtension(String fileName) {
        if (fileName == null || !fileName.contains(".")) {
            return "";
        }
        return fileName.substring(fileName.lastIndexOf(".") + 1);
    }

    /**
     * Check if file is editable
     */
    private boolean isEditableFile(String extension) {
        return EDITABLE_EXTENSIONS.contains(extension.toLowerCase());
    }

    /**
     * Check if file is read-only
     */
    public boolean isReadOnlyFile(String fileName) {
        String extension = getFileExtension(fileName).toLowerCase();
        return READONLY_EXTENSIONS.contains(extension);
    }

    /**
     * Get file category (EDITABLE, READONLY, UNKNOWN)
     */
    public String getFileCategory(String fileName) {
        String extension = getFileExtension(fileName).toLowerCase();

        if (isEditableFile(extension)) {
            return "EDITABLE";
        } else if (isReadOnlyFile(fileName)) {
            return "READONLY";
        } else {
            return "UNKNOWN";
        }
    }
}
