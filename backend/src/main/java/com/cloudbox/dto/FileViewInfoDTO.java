package com.cloudbox.dto;

public class FileViewInfoDTO {

    private final String fileUrl;

    public FileViewInfoDTO(String fileUrl) {
        this.fileUrl = fileUrl;
    }

    public String getFileUrl() {
        return fileUrl;
    }
}
