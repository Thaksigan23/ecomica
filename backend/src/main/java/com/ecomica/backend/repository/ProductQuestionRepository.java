package com.ecomica.backend.repository;

import com.ecomica.backend.model.ProductQuestion;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ProductQuestionRepository extends MongoRepository<ProductQuestion, String> {
    List<ProductQuestion> findByBookIdOrderByCreatedAtDesc(String bookId);
}
