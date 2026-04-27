package com.ecomica.backend.repository;

import com.ecomica.backend.model.Category;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface CategoryRepository extends MongoRepository<Category, String> {
}
