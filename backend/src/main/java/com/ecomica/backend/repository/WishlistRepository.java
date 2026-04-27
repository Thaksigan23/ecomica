package com.ecomica.backend.repository;

import com.ecomica.backend.model.WishlistItem;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface WishlistRepository extends MongoRepository<WishlistItem, String> {
    List<WishlistItem> findByUserId(String userId);
    Optional<WishlistItem> findByUserIdAndBookId(String userId, String bookId);
}
