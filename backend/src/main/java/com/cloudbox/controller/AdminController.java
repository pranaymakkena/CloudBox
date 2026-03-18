package com.cloudbox.controller;

import com.cloudbox.model.User;
import com.cloudbox.service.AdminService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "http://localhost:3000")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/users")
    public List<User> getUsers() {
        return adminService.getAllUsers();
    }

    @PutMapping("/suspend/{id}")
    public User suspendUser(@PathVariable Long id) {
        return adminService.suspendUser(id);
    }

    @PutMapping("/unsuspend/{id}")
    public User unsuspendUser(@PathVariable Long id) {
        return adminService.unsuspendUser(id);
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<String> deleteUser(@PathVariable Long id) {
        adminService.deleteUser(id);
        return ResponseEntity.ok("User deleted successfully");
    }

    // 🔍 Optional search
    @GetMapping("/search")
    public List<User> searchUsers(@RequestParam String email) {
        return adminService.searchUsers(email);
    }

    // 🔎 Optional filters
    @GetMapping("/active")
    public List<User> activeUsers() {
        return adminService.getActiveUsers();
    }

    @GetMapping("/suspended")
    public List<User> suspendedUsers() {
        return adminService.getSuspendedUsers();
    }
}