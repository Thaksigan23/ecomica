package com.ecomica.backend.controller;

import com.ecomica.backend.model.Address;
import com.ecomica.backend.repository.AddressRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/addresses")
@RequiredArgsConstructor
@CrossOrigin
@PreAuthorize("hasAnyRole('BUYER','ADMIN')")
public class AddressController {
    private final AddressRepository addressRepository;

    @GetMapping
    public List<Address> list(Authentication authentication) {
        return addressRepository.findByUserIdOrderByCreatedAtDesc(authentication.getName());
    }

    @PostMapping
    public Address create(Authentication authentication, @RequestBody Address address) {
        address.setId(null);
        address.setUserId(authentication.getName());
        address.setCreatedAt(Instant.now());
        return addressRepository.save(address);
    }

    @PutMapping("/{id}")
    public Address update(Authentication authentication, @PathVariable String id, @RequestBody Address payload) {
        Address address = addressRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Address not found"));
        if (!authentication.getName().equals(address.getUserId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed");
        }
        payload.setId(id);
        payload.setUserId(address.getUserId());
        payload.setCreatedAt(address.getCreatedAt());
        return addressRepository.save(payload);
    }

    @DeleteMapping("/{id}")
    public void remove(Authentication authentication, @PathVariable String id) {
        Address address = addressRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Address not found"));
        if (!authentication.getName().equals(address.getUserId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed");
        }
        addressRepository.deleteById(id);
    }
}
