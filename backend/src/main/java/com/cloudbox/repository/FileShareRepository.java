package com.cloudbox.repository;

import com.cloudbox.model.FileShare;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FileShareRepository extends JpaRepository<FileShare, Long> {

    // =========================
    // 📥 SHARED WITH USER
    // =========================
    List<FileShare> findBySharedWithOrderByCreatedAtDesc(String sharedWith);

    // =========================
    // 📤 SHARED BY OWNER
    // =========================
    List<FileShare> findByOwnerEmailOrderByCreatedAtDesc(String ownerEmail);

    // =========================
    // 📄 FILE SHARES
    // =========================
    List<FileShare> findByFileId(Long fileId);

    List<FileShare> findAllByOrderByCreatedAtDesc();

    Optional<FileShare> findByFileIdAndSharedWith(Long fileId, String sharedWith);

    boolean existsByFileIdAndSharedWith(Long fileId, String sharedWith);

    // =========================
    // 🔐 NEW: PERMISSION CHECKS (IMPORTANT)
    // =========================

    // Check specific permission
    boolean existsByFileIdAndSharedWithAndPermission(Long fileId, String sharedWith, String permission);

    // Get share with permission
    Optional<FileShare> findByFileIdAndSharedWithAndPermission(Long fileId, String sharedWith, String permission);

    // Delete all shares of a file
    void deleteByFileId(Long fileId);

    // Delete specific share
    void deleteByFileIdAndSharedWith(Long fileId, String sharedWith);
}