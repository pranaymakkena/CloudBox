package com.cloudbox.service;

import com.cloudbox.dto.LoginRequest;
import com.cloudbox.dto.RegisterRequest;
import com.cloudbox.model.Role;
import com.cloudbox.model.User;
import com.cloudbox.repository.UserRepository;
import com.cloudbox.util.JwtUtil;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    // ✅ Password encoder
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public AuthService(UserRepository userRepository, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
    }

    // ✅ REGISTER
    public String register(RegisterRequest request) {

        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new RuntimeException("Passwords do not match");
        }

        // ✅ prevent duplicate email
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        User user = new User();

        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setGender(request.getGender());
        user.setAge(request.getAge());
        user.setLocation(request.getLocation());
        user.setEmail(request.getEmail());

        // ✅ HASH PASSWORD
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        user.setRole(Role.USER);

        userRepository.save(user);

        return "User registered successfully";
    }

    // ✅ LOGIN
    public String login(LoginRequest request) {

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // ✅ check suspended
        if (user.isSuspended()) {
            throw new RuntimeException("Account suspended by admin");
        }

        // ✅ CHECK HASHED PASSWORD
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid password");
        }

        // ✅ generate JWT (role included)
        return jwtUtil.generateToken(user.getEmail(), user.getRole().name());
    }
}