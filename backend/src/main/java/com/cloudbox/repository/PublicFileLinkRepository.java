package com.cloudbox.repository;

import com.cloudbox.model.PublicFileLink;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PublicFileLinkRepository extends JpaRepository<PublicFileLink, Long> {
    Optional<PublicFileLink> findByToken(String token);

    List<PublicFileLink> findByOwnerEmailOrderByCreatedAtDesc(String ownerEmail);

    List<PublicFileLink> findByFileId(Long fileId);

    void deleteByToken(String token);
}
