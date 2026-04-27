package com.ecomica.backend.repository;

import com.ecomica.backend.model.Address;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface AddressRepository extends MongoRepository<Address, String> {
    List<Address> findByUserIdOrderByCreatedAtDesc(String userId);
}
