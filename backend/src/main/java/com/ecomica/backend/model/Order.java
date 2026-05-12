package com.ecomica.backend.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "orders")
public class Order {
    @Id
    private String id;
    private String userId;
    private Instant orderDate;
    private String status;
    private String shippingAddress;
    private String paymentMethod;
    private String paymentStatus;
    private String paymentReference;
    private BigDecimal totalAmount;
    /** Sum of line merchandise before coupon */
    private BigDecimal merchandiseSubtotal;
    private BigDecimal discountAmount;
    private BigDecimal taxAmount;
    private BigDecimal shippingAmount;
    private String couponCode;
    private List<OrderItem> items;
    private List<StatusEvent> statusHistory;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderItem {
        private String bookId;
        private String titleSnapshot;
        private BigDecimal unitPrice;
        private Integer quantity;
        private BigDecimal subtotal;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatusEvent {
        private String status;
        private Instant at;
    }
}
