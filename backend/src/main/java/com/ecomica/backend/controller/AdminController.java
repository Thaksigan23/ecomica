package com.ecomica.backend.controller;

import com.ecomica.backend.model.Order;
import com.ecomica.backend.model.Book;
import com.ecomica.backend.model.User;
import com.ecomica.backend.repository.BookRepository;
import com.ecomica.backend.repository.OrderRepository;
import com.ecomica.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@CrossOrigin
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final BookRepository bookRepository;

    @GetMapping("/users")
    public List<User> users() {
        return userRepository.findAll();
    }

    @GetMapping("/orders")
    public List<Order> orders() {
        return orderRepository.findAll();
    }

    @GetMapping("/books")
    public List<Book> books() {
        return bookRepository.findAll();
    }

    @PatchMapping("/books/{id}/moderation")
    public Book moderateBook(@PathVariable String id, @RequestBody Map<String, String> payload) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Book not found"));
        String status = payload.getOrDefault("status", "PENDING").toUpperCase();
        if (!List.of("PENDING", "APPROVED", "REJECTED").contains(status)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid moderation status");
        }
        book.setModerationStatus(status);
        book.setActive("APPROVED".equals(status));
        return bookRepository.save(book);
    }

    @PatchMapping("/users/{id}/block")
    public User blockUser(@PathVariable String id, @RequestBody Map<String, Boolean> payload) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        boolean blocked = payload.getOrDefault("blocked", true);
        user.setBlocked(blocked);
        return userRepository.save(user);
    }
}
