package com.ecomica.backend.controller;

import com.ecomica.backend.model.Book;
import com.ecomica.backend.model.Order;
import com.ecomica.backend.model.User;
import com.ecomica.backend.repository.BookRepository;
import com.ecomica.backend.repository.OrderRepository;
import com.ecomica.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/books")
@RequiredArgsConstructor
@CrossOrigin
public class BookController {
    private final BookRepository bookRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;

    @GetMapping
    public List<Book> all(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String categoryId,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) Boolean inStockOnly,
            @RequestParam(required = false) String format,
            @RequestParam(required = false) String language
    ) {
        List<Book> raw;
        if (q != null && !q.isBlank()) {
            raw = bookRepository.findByTitleContainingIgnoreCaseOrAuthorContainingIgnoreCase(q, q);
        } else if (categoryId != null && !categoryId.isBlank()) {
            raw = bookRepository.findByCategoryId(categoryId);
        } else {
            raw = bookRepository.findAll();
        }
        return raw.stream()
                .filter(this::isPubliclyVisible)
                .filter(b -> minPrice == null || b.getPrice() != null && b.getPrice().compareTo(minPrice) >= 0)
                .filter(b -> maxPrice == null || b.getPrice() != null && b.getPrice().compareTo(maxPrice) <= 0)
                .filter(b -> inStockOnly == null || !Boolean.TRUE.equals(inStockOnly)
                        || b.getStock() != null && b.getStock() > 0)
                .filter(b -> format == null || format.isBlank() || equalsIgnoreCase(b.getFormat(), format))
                .filter(b -> language == null || language.isBlank() || equalsIgnoreCase(b.getLanguage(), language))
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}/also-bought")
    public List<Book> alsoBought(@PathVariable String id) {
        bookRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Book not found"));
        Map<String, Integer> score = new HashMap<>();
        for (Order order : orderRepository.findAll()) {
            if (order.getItems() == null) {
                continue;
            }
            boolean has = order.getItems().stream().anyMatch(i -> id.equals(i.getBookId()));
            if (!has) {
                continue;
            }
            for (Order.OrderItem item : order.getItems()) {
                if (!id.equals(item.getBookId())) {
                    score.merge(item.getBookId(), item.getQuantity(), Integer::sum);
                }
            }
        }
        return score.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                .map(Map.Entry::getKey)
                .limit(6)
                .map(bookRepository::findById)
                .flatMap(java.util.Optional::stream)
                .filter(this::isPubliclyVisible)
                .limit(4)
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public Book byId(@PathVariable String id) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Book not found"));
        if (!isPubliclyVisible(book)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Book is not publicly available");
        }
        enrichSellerStorefront(book);
        return book;
    }

    private void enrichSellerStorefront(Book book) {
        String email = book.getSellerEmail();
        if (email == null || email.isBlank()) {
            return;
        }
        userRepository.findByEmailIgnoreCase(email).ifPresent((User u) -> {
            String headline = (u.getStoreName() != null && !u.getStoreName().isBlank()) ? u.getStoreName() : u.getName();
            book.setSellerStoreName(headline);
            book.setSellerStoreDescription(u.getStoreDescription());
            book.setSellerStoreWebsiteUrl(u.getStoreWebsiteUrl());
            book.setSellerLogoUrl(u.getAvatarUrl());
        });
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','SELLER')")
    public Book create(Authentication authentication, @RequestBody Book book) {
        book.setId(null);
        book.setCreatedAt(Instant.now());
        if (book.getStock() == null) {
            book.setStock(0);
        }
        boolean isAdminCreate = authentication.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        book.setSellerEmail(authentication.getName());
        book.setModerationStatus(isAdminCreate ? "APPROVED" : "PENDING");
        return bookRepository.save(book);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SELLER')")
    public Book update(Authentication authentication, @PathVariable String id, @RequestBody Book book) {
        Book existing = bookRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Book not found"));
        boolean isAdmin = authentication.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        boolean canEdit = isAdmin || authentication.getName().equals(existing.getSellerEmail());
        if (!canEdit) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only edit your own books");
        }
        book.setId(id);
        if (isAdmin) {
            if (book.getSellerEmail() == null || book.getSellerEmail().isBlank()) {
                book.setSellerEmail(existing.getSellerEmail());
            }
        } else {
            book.setSellerEmail(existing.getSellerEmail());
        }
        if (book.getCreatedAt() == null) {
            book.setCreatedAt(existing.getCreatedAt());
        }
        if (!isAdmin) {
            book.setModerationStatus(existing.getModerationStatus());
        }
        return bookRepository.save(book);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SELLER')")
    public void delete(Authentication authentication, @PathVariable String id) {
        Book existing = bookRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Book not found"));
        boolean canDelete = authentication.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))
                || authentication.getName().equals(existing.getSellerEmail());
        if (!canDelete) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only delete your own books");
        }
        bookRepository.deleteById(id);
    }

    private boolean isPubliclyVisible(Book book) {
        boolean approvedOrLegacy = book.getModerationStatus() == null
                || book.getModerationStatus().isBlank()
                || "APPROVED".equalsIgnoreCase(book.getModerationStatus());
        return book.isActive() && approvedOrLegacy;
    }

    private static boolean equalsIgnoreCase(String field, String param) {
        return field != null && field.trim().equalsIgnoreCase(param.trim());
    }
}
