package com.ecomica.backend.controller;

import com.ecomica.backend.model.Order;
import com.ecomica.backend.model.Review;
import com.ecomica.backend.repository.OrderRepository;
import com.ecomica.backend.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
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
    private final OrderRepository orderRepository;

    @GetMapping("/{bookId}")
    public List<Review> byBook(@PathVariable String bookId) {
        return reviewRepository.findByBookId(bookId);
    }

    @PostMapping("/{bookId}")
    @PreAuthorize("hasAnyRole('BUYER','ADMIN')")
    public Review upsert(Authentication authentication, @PathVariable String bookId, @RequestBody Review payload) {
        boolean verified = hasPurchased(authentication.getName(), bookId);
        Review existing = reviewRepository.findByUserIdAndBookId(authentication.getName(), bookId).orElse(null);
        if (existing != null) {
            existing.setRating(payload.getRating());
            existing.setComment(payload.getComment());
            existing.setVerifiedPurchase(verified);
            return reviewRepository.save(existing);
        }
        payload.setId(null);
        payload.setBookId(bookId);
        payload.setUserId(authentication.getName());
        payload.setCreatedAt(Instant.now());
        payload.setVerifiedPurchase(verified);
        return reviewRepository.save(payload);
    }

    private boolean hasPurchased(String userId, String bookId) {
        for (Order o : orderRepository.findByUserIdOrderByOrderDateDesc(userId)) {
            if (o.getItems() == null) {
                continue;
            }
            if (o.getStatus() != null && "CANCELLED".equalsIgnoreCase(o.getStatus())) {
                continue;
            }
            for (Order.OrderItem item : o.getItems()) {
                if (bookId.equals(item.getBookId())) {
                    return true;
                }
            }
        }
        return false;
    }
}
