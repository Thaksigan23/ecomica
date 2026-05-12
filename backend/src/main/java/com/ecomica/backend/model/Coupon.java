package com.ecomica.backend.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "coupons")
public class Coupon {
    @Id
    private String id;
    @Indexed(unique = true)
    private String code;
    /** 1–90 inclusive */
    private int discountPercent;
    private Instant validUntil;
    private boolean active;
    /** Optional minimum merchandise subtotal (before discount) to apply coupon */
    private BigDecimal minMerchandiseSubtotal;
}
