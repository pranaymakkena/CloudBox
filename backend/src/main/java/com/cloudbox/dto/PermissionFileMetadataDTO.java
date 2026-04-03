package com.cloudbox.dto;

import java.util.List;

public class PermissionFileMetadataDTO {

    private Long fileId;
    private String fileName;
    private String fileType;
    private Long fileSize;
    private List<String> availablePermissions;

    public PermissionFileMetadataDTO() {
    }

    public PermissionFileMetadataDTO(Long fileId, String fileName, String fileType, Long fileSize,
            List<String> availablePermissions) {
        this.fileId = fileId;
        this.fileName = fileName;
        this.fileType = fileType;
        this.fileSize = fileSize;
        this.availablePermissions = availablePermissions;
    }

    // Getters and Setters
    public Long getFileId() {
        return fileId;
    }

    public void setFileId(Long fileId) {
        this.fileId = fileId;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getFileType() {
        return fileType;
    }

    public void setFileType(String fileType) {
        this.fileType = fileType;
    }

    public Long getFileSize() {
        return fileSize;
    }

    public void setFileSize(Long fileSize) {
        this.fileSize = fileSize;
    }

    public List<String> getAvailablePermissions() {
        return availablePermissions;
    }

    public void setAvailablePermissions(List<String> availablePermissions) {
        this.availablePermissions = availablePermissions;
    }
}
