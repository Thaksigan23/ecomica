package com.ecomica.backend.controller;

import com.ecomica.backend.model.Book;
import com.ecomica.backend.repository.BookRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/books")
@RequiredArgsConstructor
@CrossOrigin
public class BookController {
    private final BookRepository bookRepository;

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
        Book book = bookRepository.findById(id).orElseThrow();
        if (!isPubliclyVisible(book)) {
            throw new RuntimeException("Book is not publicly available");
        }
        return book;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','SELLER')")
    public Book create(Authentication authentication, @RequestBody Book book) {
        book.setId(null);
        book.setCreatedAt(Instant.now());
        if (book.getStock() == null) {
            book.setStock(0);
        }
        boolean isAdmin = authentication.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        book.setSellerEmail(authentication.getName());
        book.setModerationStatus(isAdmin ? "APPROVED" : "PENDING");
        return bookRepository.save(book);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SELLER')")
    public Book update(Authentication authentication, @PathVariable String id, @RequestBody Book book) {
        Book existing = bookRepository.findById(id).orElseThrow();
        boolean canEdit = authentication.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))
                || authentication.getName().equals(existing.getSellerEmail());
        if (!canEdit) {
            throw new RuntimeException("You can only edit your own books");
        }
        book.setId(id);
        if (book.getSellerEmail() == null || book.getSellerEmail().isBlank()) {
            book.setSellerEmail(existing.getSellerEmail());
        }
        if (book.getCreatedAt() == null) {
            book.setCreatedAt(existing.getCreatedAt());
        }
        if (!authentication.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            book.setModerationStatus(existing.getModerationStatus());
        }
        return bookRepository.save(book);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SELLER')")
    public void delete(Authentication authentication, @PathVariable String id) {
        Book existing = bookRepository.findById(id).orElseThrow();
        boolean canDelete = authentication.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))
                || authentication.getName().equals(existing.getSellerEmail());
        if (!canDelete) {
            throw new RuntimeException("You can only delete your own books");
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
