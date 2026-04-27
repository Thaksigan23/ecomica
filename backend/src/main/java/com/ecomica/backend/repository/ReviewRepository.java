package com.ecomica.backend.repository;

import com.ecomica.backend.model.Review;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends MongoRepository<Review, String> {
    List<Review> findByBookId(String bookId);
    Optional<Review> findByUserIdAndBookId(String userId, String bookId);
}
