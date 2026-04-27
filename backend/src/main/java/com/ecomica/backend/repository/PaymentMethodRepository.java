package com.ecomica.backend.repository;

import com.ecomica.backend.model.PaymentMethod;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface PaymentMethodRepository extends MongoRepository<PaymentMethod, String> {
    List<PaymentMethod> findByUserIdOrderByCreatedAtDesc(String userId);
    Optional<PaymentMethod> findByIdAndUserId(String id, String userId);
}
