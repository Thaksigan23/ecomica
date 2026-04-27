package com.ecomica.backend.controller;

import com.ecomica.backend.dto.CheckoutRequest;
import com.ecomica.backend.model.Book;
import com.ecomica.backend.model.CartItem;
import com.ecomica.backend.model.Order;
import com.ecomica.backend.repository.BookRepository;
import com.ecomica.backend.repository.CartItemRepository;
import com.ecomica.backend.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@CrossOrigin
public class OrderController {
    private final OrderRepository orderRepository;
    private final CartItemRepository cartItemRepository;
    private final BookRepository bookRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('BUYER','ADMIN')")
    public List<Order> myOrders(Authentication authentication) {
        return orderRepository.findByUserIdOrderByOrderDateDesc(authentication.getName());
    }

    @PostMapping("/checkout")
    @PreAuthorize("hasAnyRole('BUYER','ADMIN')")
    public Order checkout(Authentication authentication, @RequestBody CheckoutRequest request) {
        String paymentMethod = request.getPaymentMethod() == null || request.getPaymentMethod().isBlank() ? "COD" : request.getPaymentMethod();
        if ("CARD".equalsIgnoreCase(paymentMethod)) {
            if (request.getCardNumber() == null || request.getCardNumber().length() < 12
                    || request.getCardName() == null || request.getCardName().isBlank()
                    || request.getExpiry() == null || request.getExpiry().isBlank()
                    || request.getCvv() == null || request.getCvv().length() < 3) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid card payment details");
            }
        }
        List<CartItem> cartItems = cartItemRepository.findByUserId(authentication.getName());
        if (cartItems.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cart is empty");
        }
        List<Order.OrderItem> items = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;

        for (CartItem cartItem : cartItems) {
            Book book = bookRepository.findById(cartItem.getBookId()).orElseThrow();
            BigDecimal subtotal = book.getPrice().multiply(BigDecimal.valueOf(cartItem.getQuantity()));
            items.add(Order.OrderItem.builder()
                    .bookId(book.getId())
                    .titleSnapshot(book.getTitle())
                    .unitPrice(book.getPrice())
                    .quantity(cartItem.getQuantity())
                    .subtotal(subtotal)
                    .build());
            total = total.add(subtotal);
            book.setStock(Math.max(0, book.getStock() - cartItem.getQuantity()));
            bookRepository.save(book);
        }

        Order order = Order.builder()
                .userId(authentication.getName())
                .orderDate(Instant.now())
                .status("PLACED")
                .paymentMethod(paymentMethod)
                .paymentStatus(resolvePaymentStatus(paymentMethod))
                .paymentReference(generatePaymentReference(paymentMethod))
                .shippingAddress(request.getShippingAddress() == null || request.getShippingAddress().isBlank() ? "Not provided" : request.getShippingAddress())
                .totalAmount(total)
                .items(items)
                .statusHistory(List.of(
                        Order.StatusEvent.builder().status("PLACED").at(Instant.now()).build(),
                        Order.StatusEvent.builder().status("CONFIRMED").at(Instant.now().plusSeconds(60)).build()
                ))
                .build();
        Order saved = orderRepository.save(order);
        cartItemRepository.deleteByUserId(authentication.getName());
        return saved;
    }

    private String resolvePaymentStatus(String paymentMethod) {
        if ("CARD".equalsIgnoreCase(paymentMethod) || "UPI".equalsIgnoreCase(paymentMethod)) {
            return "PAID";
        }
        return "PENDING";
    }

    private String generatePaymentReference(String paymentMethod) {
        return paymentMethod.toUpperCase() + "-" + System.currentTimeMillis();
    }
}
