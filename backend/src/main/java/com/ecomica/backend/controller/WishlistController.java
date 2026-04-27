package com.ecomica.backend.controller;

import com.ecomica.backend.model.WishlistItem;
import com.ecomica.backend.repository.WishlistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/wishlist")
@RequiredArgsConstructor
@CrossOrigin
public class WishlistController {
    private final WishlistRepository wishlistRepository;

    @GetMapping
    public List<WishlistItem> list(Authentication authentication) {
        return wishlistRepository.findByUserId(authentication.getName());
    }

    @PostMapping("/{bookId}")
    public WishlistItem add(Authentication authentication, @PathVariable String bookId) {
        return wishlistRepository.findByUserIdAndBookId(authentication.getName(), bookId).orElseGet(() ->
                wishlistRepository.save(WishlistItem.builder()
                        .userId(authentication.getName())
                        .bookId(bookId)
                        .addedAt(Instant.now())
                        .build()));
    }

    @DeleteMapping("/{bookId}")
    public void remove(Authentication authentication, @PathVariable String bookId) {
        wishlistRepository.findByUserIdAndBookId(authentication.getName(), bookId)
                .ifPresent(wishlistRepository::delete);
    }
}
