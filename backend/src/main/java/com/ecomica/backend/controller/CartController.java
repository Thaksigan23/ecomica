package com.ecomica.backend.controller;

import com.ecomica.backend.model.CartItem;
import com.ecomica.backend.repository.CartItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.time.Instant;
import java.util.List;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
@CrossOrigin
public class CartController {
    private final CartItemRepository cartItemRepository;

    @GetMapping
    public List<CartItem> myCart(Authentication authentication) {
        return cartItemRepository.findByUserId(authentication.getName());
    }

    @PostMapping
    public CartItem add(Authentication authentication, @RequestBody CartItem payload) {
        String userId = authentication.getName();
        CartItem existing = cartItemRepository.findByUserIdAndBookId(userId, payload.getBookId()).orElse(null);
        if (existing != null) {
            existing.setQuantity(existing.getQuantity() + Math.max(1, payload.getQuantity()));
            existing.setUpdatedAt(Instant.now());
            return cartItemRepository.save(existing);
        }
        payload.setId(null);
        payload.setUserId(userId);
        payload.setQuantity(Math.max(1, payload.getQuantity()));
        payload.setUpdatedAt(Instant.now());
        return cartItemRepository.save(payload);
    }

    @DeleteMapping("/{id}")
    public void remove(@PathVariable String id) {
        cartItemRepository.deleteById(id);
    }

    @PatchMapping("/{id}")
    public CartItem updateQuantity(Authentication authentication, @PathVariable String id, @RequestBody Map<String, Integer> payload) {
        CartItem item = cartItemRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cart item not found"));
        if (!authentication.getName().equals(item.getUserId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed");
        }
        int quantity = Math.max(1, payload.getOrDefault("quantity", 1));
        item.setQuantity(quantity);
        item.setUpdatedAt(Instant.now());
        return cartItemRepository.save(item);
    }
}
