package com.cloudbox.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "files")
public class FileEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String fileName;

    @Column(name = "file_url")
    private String fileUrl;

    @Column(name = "file_size")
    private Long size;

    @Column(name = "file_type")
    private String contentType;

    @JsonIgnore
    @Column(name = "storage_key")
    private String storageKey;

    private String ownerEmail;
    private String folder;

    @Column(name = "uploaded_at")
    private LocalDateTime uploadDate;

    public FileEntity() {
    }

    // ✅ GETTERS & SETTERS

    public Long getId() {
        return id;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getFileUrl() {
        return fileUrl;
    }

    public void setFileUrl(String fileUrl) {
        this.fileUrl = fileUrl;
    }

    public Long getSize() {
        return size;
    }

    public void setSize(Long size) {
        this.size = size;
    }

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }

    public String getStorageKey() {
        return storageKey;
    }

    public void setStorageKey(String storageKey) {
        this.storageKey = storageKey;
    }

    public String getOwnerEmail() {
        return ownerEmail;
    }

    public void setOwnerEmail(String ownerEmail) {
        this.ownerEmail = ownerEmail;
    }

    public String getFolder() {
        return folder;
    }

    public void setFolder(String folder) {
        this.folder = folder;
    }

    public LocalDateTime getUploadDate() {
        return uploadDate;
    }

    public void setUploadDate(LocalDateTime uploadDate) {
        this.uploadDate = uploadDate;
    }

    public Long getFileSize() {
        return size;
    }

    public void setFileSize(Long fileSize) {
        this.size = fileSize;
    }

    public String getFileType() {
        return contentType;
    }

    public void setFileType(String fileType) {
        this.contentType = fileType;
    }

    public LocalDateTime getUploadedAt() {
        return uploadDate;
    }

    public void setUploadedAt(LocalDateTime uploadedAt) {
        this.uploadDate = uploadedAt;
    }
}
