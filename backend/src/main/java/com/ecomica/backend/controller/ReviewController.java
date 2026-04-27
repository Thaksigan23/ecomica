package com.ecomica.backend.controller;

import com.ecomica.backend.model.Review;
import com.ecomica.backend.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
@CrossOrigin
public class ReviewController {
    private final ReviewRepository reviewRepository;

    @GetMapping("/{bookId}")
    public List<Review> byBook(@PathVariable String bookId) {
        return reviewRepository.findByBookId(bookId);
    }

    @PostMapping("/{bookId}")
    public Review upsert(Authentication authentication, @PathVariable String bookId, @RequestBody Review payload) {
        Review existing = reviewRepository.findByUserIdAndBookId(authentication.getName(), bookId).orElse(null);
        if (existing != null) {
            existing.setRating(payload.getRating());
            existing.setComment(payload.getComment());
            return reviewRepository.save(existing);
        }
        payload.setId(null);
        payload.setBookId(bookId);
        payload.setUserId(authentication.getName());
        payload.setCreatedAt(Instant.now());
        return reviewRepository.save(payload);
    }
}
