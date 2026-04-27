package com.ecomica.backend.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "payment_methods")
public class PaymentMethod {
    @Id
    private String id;
    @Indexed
    private String userId;
    private String type; // CARD or UPI
    private String label;
    private String provider;
    private String cardLast4;
    private String upiId;
    private boolean isDefault;
    private Instant createdAt;
}
