package com.ecomica.backend.controller;

import com.ecomica.backend.dto.CheckoutRequest;
import com.ecomica.backend.model.Book;
import com.ecomica.backend.model.CartItem;
import com.ecomica.backend.model.Coupon;
import com.ecomica.backend.model.Order;
import com.ecomica.backend.repository.BookRepository;
import com.ecomica.backend.repository.CartItemRepository;
import com.ecomica.backend.repository.CouponRepository;
import com.ecomica.backend.repository.OrderRepository;
import com.ecomica.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@CrossOrigin
public class OrderController {
    private static final BigDecimal FREE_SHIPPING_THRESHOLD = new BigDecimal("999");
    private static final BigDecimal FLAT_SHIPPING = new BigDecimal("49");
    private static final BigDecimal TAX_RATE = new BigDecimal("0.05");

    private final OrderRepository orderRepository;
    private final CartItemRepository cartItemRepository;
    private final BookRepository bookRepository;
    private final CouponRepository couponRepository;
    private final UserRepository userRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('BUYER','ADMIN')")
    public List<Order> myOrders(Authentication authentication) {
        return orderRepository.findByUserIdOrderByOrderDateDesc(authentication.getName());
    }

    @PatchMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('BUYER','ADMIN')")
    public Order cancel(Authentication authentication, @PathVariable String id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
        boolean admin = authentication.getAuthorities().stream().anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
        if (!admin && !authentication.getName().equals(order.getUserId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your order");
        }
        if (!"PLACED".equalsIgnoreCase(order.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only PLACED orders can be cancelled");
        }
        if (order.getItems() != null) {
            for (Order.OrderItem item : order.getItems()) {
                bookRepository.findById(item.getBookId()).ifPresent(book -> {
                    int add = item.getQuantity() == null ? 0 : item.getQuantity();
                    book.setStock((book.getStock() == null ? 0 : book.getStock()) + add);
                    bookRepository.save(book);
                });
            }
        }
        order.setStatus("CANCELLED");
        if (order.getStatusHistory() == null) {
            order.setStatusHistory(new ArrayList<>());
        }
        order.getStatusHistory().add(Order.StatusEvent.builder().status("CANCELLED").at(Instant.now()).build());
        return orderRepository.save(order);
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
        BigDecimal merchandiseSubtotal = BigDecimal.ZERO;

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
            merchandiseSubtotal = merchandiseSubtotal.add(subtotal);
            book.setStock(Math.max(0, (book.getStock() == null ? 0 : book.getStock()) - cartItem.getQuantity()));
            bookRepository.save(book);
        }

        BigDecimal discountAmount = BigDecimal.ZERO;
        BigDecimal afterCouponMerch = merchandiseSubtotal;
        String appliedCoupon = null;
        String couponInput = request.getCouponCode() == null ? "" : request.getCouponCode().trim();
        if (!couponInput.isEmpty()) {
            Coupon coupon = couponRepository.findByCodeIgnoreCase(couponInput)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown coupon code"));
            if (!coupon.isActive()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Coupon is not active");
            }
            if (coupon.getValidUntil() != null && coupon.getValidUntil().isBefore(Instant.now())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Coupon has expired");
            }
            if (coupon.getMinMerchandiseSubtotal() != null
                    && merchandiseSubtotal.compareTo(coupon.getMinMerchandiseSubtotal()) < 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Merchandise subtotal is below coupon minimum");
            }
            int pct = Math.min(90, Math.max(1, coupon.getDiscountPercent()));
            BigDecimal factor = BigDecimal.ONE.subtract(BigDecimal.valueOf(pct).movePointLeft(2));
            afterCouponMerch = merchandiseSubtotal.multiply(factor).setScale(2, RoundingMode.HALF_UP);
            discountAmount = merchandiseSubtotal.subtract(afterCouponMerch);
            appliedCoupon = coupon.getCode();
        }

        BigDecimal shippingAmount = afterCouponMerch.compareTo(FREE_SHIPPING_THRESHOLD) >= 0
                ? BigDecimal.ZERO
                : FLAT_SHIPPING;
        BigDecimal taxAmount = afterCouponMerch.multiply(TAX_RATE).setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalAmount = afterCouponMerch.add(shippingAmount).add(taxAmount);

        Order order = Order.builder()
                .userId(authentication.getName())
                .orderDate(Instant.now())
                .status("PLACED")
                .paymentMethod(paymentMethod)
                .paymentStatus(resolvePaymentStatus(paymentMethod))
                .paymentReference(generatePaymentReference(paymentMethod))
                .shippingAddress(request.getShippingAddress() == null || request.getShippingAddress().isBlank() ? "Not provided" : request.getShippingAddress())
                .merchandiseSubtotal(merchandiseSubtotal)
                .discountAmount(discountAmount)
                .taxAmount(taxAmount)
                .shippingAmount(shippingAmount)
                .couponCode(appliedCoupon)
                .totalAmount(totalAmount)
                .items(items)
                .statusHistory(List.of(
                        Order.StatusEvent.builder().status("PLACED").at(Instant.now()).build(),
                        Order.StatusEvent.builder().status("CONFIRMED").at(Instant.now().plusSeconds(60)).build()
                ))
                .build();
        Order saved = orderRepository.save(order);
        cartItemRepository.deleteByUserId(authentication.getName());

        userRepository.findByEmailIgnoreCase(authentication.getName()).ifPresent(user -> {
            long add = 10L + totalAmount.longValue() / 50;
            long cur = user.getLoyaltyPoints() == null ? 0L : user.getLoyaltyPoints();
            user.setLoyaltyPoints(cur + add);
            userRepository.save(user);
        });

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
