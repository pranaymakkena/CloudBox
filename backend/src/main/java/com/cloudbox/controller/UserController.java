package com.cloudbox.controller;

import com.cloudbox.model.User;
import com.cloudbox.service.UserService;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/user")
@CrossOrigin(origins = "http://localhost:3000")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    // ✅ GET PROFILE (SECURE)
    @GetMapping("/profile")
    public User getProfile(Principal principal) {
        return userService.getProfile(principal.getName());
    }

    // ✅ UPDATE PROFILE (SECURE)
    @PutMapping("/profile")
    public User updateProfile(@RequestBody User user,
                              Principal principal) {
        return userService.updateProfile(principal.getName(), user);
    }
}