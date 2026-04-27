package com.ecomica.backend.repository;

import com.ecomica.backend.model.Order;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface OrderRepository extends MongoRepository<Order, String> {
    List<Order> findByUserIdOrderByOrderDateDesc(String userId);
}
