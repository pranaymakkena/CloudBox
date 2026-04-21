package com.cloudbox.controller;

import com.cloudbox.dto.CloudProviderRequest;
import com.cloudbox.dto.CloudProviderResponse;
import com.cloudbox.service.CloudProviderService;
import com.cloudbox.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST controller for managing user's cloud storage providers.
 */
@RestController
@RequestMapping("/api/cloud-providers")
public class CloudProviderController {

    @Autowired
    private CloudProviderService cloudProviderService;

    @Autowired
    private UserService userService;

    /**
     * Get all configured cloud providers for the current user.
     */
    @GetMapping
    public ResponseEntity<List<CloudProviderResponse>> getProviders(Authentication authentication) {
        String email = authentication.getName();
        Long userId = userService.getUserIdByEmail(email);
        return ResponseEntity.ok(cloudProviderService.getProviders(userId));
    }

    /**
     * Get a specific provider by ID.
     */
    @GetMapping("/{providerId}")
    public ResponseEntity<CloudProviderResponse> getProvider(@PathVariable Long providerId,
            Authentication authentication) {
        String email = authentication.getName();
        Long userId = userService.getUserIdByEmail(email);
        return ResponseEntity.ok(cloudProviderService.getProvider(userId, providerId));
    }

    /**
     * Add a new cloud provider.
     */
    @PostMapping
    public ResponseEntity<CloudProviderResponse> addProvider(
            @Valid @RequestBody CloudProviderRequest request, Authentication authentication) {
        String email = authentication.getName();
        Long userId = userService.getUserIdByEmail(email);
        return ResponseEntity.ok(cloudProviderService.addProvider(userId, request));
    }

    /**
     * Update provider settings (e.g., set as default).
     */
    @PutMapping("/{providerId}")
    public ResponseEntity<CloudProviderResponse> updateProvider(
            @PathVariable Long providerId,
            @RequestBody Map<String, Boolean> updates, Authentication authentication) {
        String email = authentication.getName();
        Long userId = userService.getUserIdByEmail(email);
        Boolean setAsDefault = updates.get("setAsDefault");

        if (setAsDefault != null && setAsDefault) {
            return ResponseEntity.ok(cloudProviderService.updateProvider(userId, providerId, true));
        }

        return ResponseEntity.badRequest().build();
    }

    /**
     * Remove a cloud provider.
     */
    @DeleteMapping("/{providerId}")
    public ResponseEntity<Void> removeProvider(@PathVariable Long providerId, Authentication authentication) {
        String email = authentication.getName();
        Long userId = userService.getUserIdByEmail(email);
        cloudProviderService.removeProvider(userId, providerId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Test connection to a provider without saving.
     */
    @PostMapping("/test-connection")
    public ResponseEntity<Map<String, Object>> testConnection(
            @Valid @RequestBody CloudProviderRequest request) {
        boolean success = cloudProviderService.testProviderConnection(request);

        return ResponseEntity.ok(Map.of(
                "success", success,
                "message", success ? "Connection successful" : "Connection failed"));
    }

    /**
     * Get available provider types.
     */
    @GetMapping("/available-types")
    public ResponseEntity<List<Map<String, String>>> getAvailableTypes() {
        return ResponseEntity.ok(List.of(
                Map.of("type", "AWS_S3", "name", "Amazon S3"),
                Map.of("type", "GCS", "name", "Google Cloud Storage"),
                Map.of("type", "AZURE_BLOB", "name", "Azure Blob Storage"),
                Map.of("type", "MINIO", "name", "MinIO Server"),
                Map.of("type", "LOCAL", "name", "Local Storage")));
    }
}