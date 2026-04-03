package com.cloudbox.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "public_file_links")
public class PublicFileLink {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String token;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "file_id", nullable = false)
    private FileEntity file;

    private String ownerEmail;
    private String permission; // VIEW or DOWNLOAD
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt; // null = never expires

    public Long getId() { return id; }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public FileEntity getFile() { return file; }
    public void setFile(FileEntity file) { this.file = file; }

    public String getOwnerEmail() { return ownerEmail; }
    public void setOwnerEmail(String ownerEmail) { this.ownerEmail = ownerEmail; }

    public String getPermission() { return permission; }
    public void setPermission(String permission) { this.permission = permission; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }

    public boolean isExpired() {
        return expiresAt != null && expiresAt.isBefore(LocalDateTime.now());
    }
}
