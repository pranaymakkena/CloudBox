package com.cloudbox.dto;

public class FileUploadResponse {

    private final String fileName;
    private final String fileUrl;

    public FileUploadResponse(String fileName, String fileUrl) {
        this.fileName = fileName;
        this.fileUrl = fileUrl;
    }

    public String getFileName() {
        return fileName;
    }

    public String getFileUrl() {
        return fileUrl;
    }
}
