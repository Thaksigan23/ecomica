package com.ecomica.backend.dto;

import lombok.Data;

@Data
public class CheckoutRequest {
    private String paymentMethod;
    private String cardNumber;
    private String cardName;
    private String expiry;
    private String cvv;
    private String shippingAddress;
}
