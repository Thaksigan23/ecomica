package com.ecomica.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CheckoutRequest {

    @NotBlank(message = "Payment method is required")
    private String paymentMethod;

    @NotBlank(message = "Card number is required")
    @Size(min = 16, max = 16, message = "Card number must be 16 digits")
    private String cardNumber;

    @NotBlank(message = "Card holder name is required")
    private String cardName;

    @NotBlank(message = "Expiry date is required")
    @Pattern(
        regexp = "^(0[1-9]|1[0-2])/([0-9]{2})$",
        message = "Expiry must be in MM/YY format"
    )
    private String expiry;

    @NotBlank(message = "CVV is required")
    @Size(min = 3, max = 4, message = "CVV must be 3 or 4 digits")
    private String cvv;

    @NotBlank(message = "Shipping address is required")
    private String shippingAddress;

    /** Optional promotional code (e.g. SAVE10) */
    private String couponCode;
}