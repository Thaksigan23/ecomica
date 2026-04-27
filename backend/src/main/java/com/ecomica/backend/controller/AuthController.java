package com.ecomica.backend.controller;

import com.ecomica.backend.dto.AuthRequest;
import com.ecomica.backend.dto.AuthResponse;
import com.ecomica.backend.dto.LoginRequest;
import com.ecomica.backend.model.Role;
import com.ecomica.backend.model.User;
import com.ecomica.backend.repository.UserRepository;
import com.ecomica.backend.security.JwtService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin
public class AuthController {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody AuthRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email already exists");
        }

        Role role = Role.BUYER;
        if ("SELLER".equalsIgnoreCase(request.getRole())) {
            role = Role.SELLER;
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .blocked(false)
                .createdAt(Instant.now())
                .build();
        userRepository.save(user);
        String normalizedRole = normalizeRole(user.getRole());
        String token = jwtService.generateToken(user.getEmail(), normalizedRole);
        return new AuthResponse(token, normalizedRole, user.getName(), user.getEmail());
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }
        if (user.isBlocked()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Your account is blocked by admin");
        }
        String normalizedRole = normalizeRole(user.getRole());
        String token = jwtService.generateToken(user.getEmail(), normalizedRole);
        return new AuthResponse(token, normalizedRole, user.getName(), user.getEmail());
    }

    private String normalizeRole(Role role) {
        if (role == Role.USER) {
            return Role.BUYER.name();
        }
        return role.name();
    }
}
