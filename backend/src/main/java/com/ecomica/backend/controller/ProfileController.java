package com.ecomica.backend.controller;

import com.ecomica.backend.model.User;
import com.ecomica.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
@CrossOrigin
@PreAuthorize("hasAnyRole('BUYER','SELLER','ADMIN','USER')")
public class ProfileController {
    private final UserRepository userRepository;

    @GetMapping("/me")
    public Map<String, Object> me(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Profile not found"));
        return toProfilePayload(user);
    }

    @PatchMapping("/me")
    public Map<String, Object> updateMe(Authentication authentication, @RequestBody Map<String, String> payload) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Profile not found"));
        String name = payload.getOrDefault("name", user.getName());
        String phone = payload.getOrDefault("phone", user.getPhone());
        String avatarUrl = payload.getOrDefault("avatarUrl", user.getAvatarUrl());
        user.setName(name == null ? null : name.trim());
        user.setPhone(phone == null ? null : phone.trim());
        user.setAvatarUrl(avatarUrl == null ? null : avatarUrl.trim());
        return toProfilePayload(userRepository.save(user));
    }

    private Map<String, Object> toProfilePayload(User user) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("id", user.getId());
        payload.put("name", user.getName());
        payload.put("email", user.getEmail());
        payload.put("phone", user.getPhone());
        payload.put("avatarUrl", user.getAvatarUrl());
        payload.put("role", user.getRole());
        payload.put("createdAt", user.getCreatedAt());
        return payload;
    }
}
