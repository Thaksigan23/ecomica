package com.ecomica.backend.controller;

import com.ecomica.backend.model.Role;
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
    private static final int MAX_BIO = 600;
    private static final int MAX_STORE_DESC = 2000;
    private static final int MAX_STORE_NAME = 120;
    private static final int MAX_GENRES = 240;
    private static final int MAX_URL = 500;

    private final UserRepository userRepository;

    @GetMapping("/me")
    public Map<String, Object> me(Authentication authentication) {
        User user = userRepository.findByEmailIgnoreCase(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Profile not found"));
        return toProfilePayload(user);
    }

    @PatchMapping("/me")
    public Map<String, Object> updateMe(Authentication authentication, @RequestBody Map<String, Object> payload) {
        User user = userRepository.findByEmailIgnoreCase(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Profile not found"));
        Role role = user.getRole();
        boolean admin = role == Role.ADMIN;
        boolean buyerLike = role == Role.BUYER || role == Role.USER || admin;
        boolean sellerLike = role == Role.SELLER || admin;

        if (payload.containsKey("name")) {
            String name = asTrimmedString(payload.get("name"));
            user.setName(name);
        }
        if (payload.containsKey("phone")) {
            user.setPhone(asTrimmedString(payload.get("phone")));
        }
        if (payload.containsKey("avatarUrl")) {
            user.setAvatarUrl(asTrimmedString(payload.get("avatarUrl")));
        }

        if (buyerLike) {
            if (payload.containsKey("bio")) {
                user.setBio(clamp(asTrimmedString(payload.get("bio")), MAX_BIO));
            }
            if (payload.containsKey("favoriteGenres")) {
                user.setFavoriteGenres(clamp(asTrimmedString(payload.get("favoriteGenres")), MAX_GENRES));
            }
            if (payload.containsKey("newsletterOptIn")) {
                user.setNewsletterOptIn(asBoolean(payload.get("newsletterOptIn")));
            }
        }
        if (sellerLike) {
            if (payload.containsKey("storeName")) {
                user.setStoreName(clamp(asTrimmedString(payload.get("storeName")), MAX_STORE_NAME));
            }
            if (payload.containsKey("storeDescription")) {
                user.setStoreDescription(clamp(asTrimmedString(payload.get("storeDescription")), MAX_STORE_DESC));
            }
            if (payload.containsKey("storeWebsiteUrl")) {
                user.setStoreWebsiteUrl(clamp(asTrimmedString(payload.get("storeWebsiteUrl")), MAX_URL));
            }
        }

        return toProfilePayload(userRepository.save(user));
    }

    private static String asTrimmedString(Object v) {
        if (v == null) {
            return null;
        }
        String s = String.valueOf(v).trim();
        return s.isEmpty() ? null : s;
    }

    private static Boolean asBoolean(Object v) {
        if (v instanceof Boolean b) {
            return b;
        }
        if (v == null) {
            return false;
        }
        return Boolean.parseBoolean(String.valueOf(v));
    }

    private static String clamp(String s, int max) {
        if (s == null) {
            return null;
        }
        return s.length() <= max ? s : s.substring(0, max);
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
        payload.put("bio", user.getBio());
        payload.put("favoriteGenres", user.getFavoriteGenres());
        payload.put("newsletterOptIn", Boolean.TRUE.equals(user.getNewsletterOptIn()));
        payload.put("storeName", user.getStoreName());
        payload.put("storeDescription", user.getStoreDescription());
        payload.put("storeWebsiteUrl", user.getStoreWebsiteUrl());
        payload.put("loyaltyPoints", user.getLoyaltyPoints() == null ? 0L : user.getLoyaltyPoints());
        return payload;
    }
}
