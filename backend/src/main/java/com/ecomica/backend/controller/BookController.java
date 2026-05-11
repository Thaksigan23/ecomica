package com.ecomica.backend.controller;

import com.ecomica.backend.model.Book;
import com.ecomica.backend.model.User;
import com.ecomica.backend.repository.BookRepository;
import com.ecomica.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/books")
@RequiredArgsConstructor
@CrossOrigin
public class BookController {
    private final BookRepository bookRepository;
    private final UserRepository userRepository;

    @GetMapping
    public List<Book> all(@RequestParam(required = false) String q, @RequestParam(required = false) String categoryId) {
        if (q != null && !q.isBlank()) {
            return bookRepository.findByTitleContainingIgnoreCaseOrAuthorContainingIgnoreCase(q, q).stream()
                    .filter(this::isPubliclyVisible)
                    .collect(Collectors.toList());
        }
        if (categoryId != null && !categoryId.isBlank()) {
            return bookRepository.findByCategoryId(categoryId).stream()
                    .filter(this::isPubliclyVisible)
                    .collect(Collectors.toList());
        }
        return bookRepository.findAll().stream().filter(this::isPubliclyVisible).collect(Collectors.toList());
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
}
