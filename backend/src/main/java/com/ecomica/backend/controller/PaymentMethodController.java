package com.ecomica.backend.controller;

import com.ecomica.backend.model.PaymentMethod;
import com.ecomica.backend.model.User;
import com.ecomica.backend.repository.PaymentMethodRepository;
import com.ecomica.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payment-methods")
@RequiredArgsConstructor
@CrossOrigin
@PreAuthorize("hasAnyRole('BUYER','SELLER','ADMIN','USER')")
public class PaymentMethodController {
    private final PaymentMethodRepository paymentMethodRepository;
    private final UserRepository userRepository;

    @GetMapping
    public List<PaymentMethod> all(Authentication authentication) {
        String userId = getUserId(authentication);
        return paymentMethodRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @PostMapping
    public PaymentMethod create(Authentication authentication, @RequestBody PaymentMethod input) {
        String userId = getUserId(authentication);
        PaymentMethod method = PaymentMethod.builder()
                .userId(userId)
                .type((input.getType() == null ? "CARD" : input.getType()).toUpperCase())
                .label(input.getLabel())
                .provider(input.getProvider())
                .cardLast4(input.getCardLast4())
                .upiId(input.getUpiId())
                .isDefault(input.isDefault())
                .createdAt(Instant.now())
                .build();
        if (method.isDefault()) {
            clearDefault(userId);
        }
        return paymentMethodRepository.save(method);
    }

    @PatchMapping("/{id}/default")
    public PaymentMethod makeDefault(Authentication authentication, @PathVariable String id) {
        String userId = getUserId(authentication);
        PaymentMethod method = paymentMethodRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment method not found"));
        clearDefault(userId);
        method.setDefault(true);
        return paymentMethodRepository.save(method);
    }

    @DeleteMapping("/{id}")
    public void delete(Authentication authentication, @PathVariable String id) {
        String userId = getUserId(authentication);
        PaymentMethod method = paymentMethodRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment method not found"));
        paymentMethodRepository.deleteById(method.getId());
    }

    private String getUserId(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        return user.getId();
    }

    private void clearDefault(String userId) {
        List<PaymentMethod> all = paymentMethodRepository.findByUserIdOrderByCreatedAtDesc(userId);
        for (PaymentMethod paymentMethod : all) {
            if (paymentMethod.isDefault()) {
                paymentMethod.setDefault(false);
                paymentMethodRepository.save(paymentMethod);
            }
        }
    }
}
