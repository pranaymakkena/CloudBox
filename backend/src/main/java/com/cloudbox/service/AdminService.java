package com.cloudbox.service;

import com.cloudbox.model.User;
import com.cloudbox.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AdminService {

    private final UserRepository userRepository;

    public AdminService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // ✅ Get all users
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    // ✅ Suspend user
    public User suspendUser(Long id) {
        User user = userRepository.findById(id).orElseThrow();
        user.setSuspended(true);
        return userRepository.save(user);
    }

    // ✅ Unsuspend user (NEW)
    public User unsuspendUser(Long id) {
        User user = userRepository.findById(id).orElseThrow();
        user.setSuspended(false);
        return userRepository.save(user);
    }

    // ✅ Delete user
    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }

    // 🔍 Search users by email (NEW)
    public List<User> searchUsers(String email) {
        return userRepository.findByEmailContainingIgnoreCase(email);
    }

    // 🟢 Active users (NEW)
    public List<User> getActiveUsers() {
        return userRepository.findBySuspendedFalse();
    }

    // 🔴 Suspended users (NEW)
    public List<User> getSuspendedUsers() {
        return userRepository.findBySuspendedTrue();
    }
}