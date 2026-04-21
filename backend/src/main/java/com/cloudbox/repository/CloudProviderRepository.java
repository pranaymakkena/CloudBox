package com.cloudbox.repository;

import com.cloudbox.model.CloudProviderEntity;
import com.cloudbox.storage.ProviderType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for managing user's cloud provider configurations.
 */
@Repository
public interface CloudProviderRepository extends JpaRepository<CloudProviderEntity, Long> {

    /**
     * Find all cloud providers for a specific user.
     */
    List<CloudProviderEntity> findByUserId(Long userId);

    /**
     * Find all active cloud providers for a user.
     */
    List<CloudProviderEntity> findByUserIdAndActiveTrue(Long userId);

    /**
     * Find a specific provider for a user.
     */
    Optional<CloudProviderEntity> findByUserIdAndProviderType(Long userId, ProviderType providerType);

    /**
     * Find the default provider for a user.
     */
    Optional<CloudProviderEntity> findByUserIdAndIsDefaultTrue(Long userId);

    /**
     * Check if a user has a specific provider type configured.
     */
    boolean existsByUserIdAndProviderType(Long userId, ProviderType providerType);

    /**
     * Count active providers for a user.
     */
    long countByUserIdAndActiveTrue(Long userId);
}