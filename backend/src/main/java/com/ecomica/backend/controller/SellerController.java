package com.ecomica.backend.controller;

import com.ecomica.backend.model.Book;
import com.ecomica.backend.model.Order;
import com.ecomica.backend.repository.BookRepository;
import com.ecomica.backend.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/seller")
@RequiredArgsConstructor
@CrossOrigin
@PreAuthorize("hasAnyRole('SELLER','ADMIN')")
public class SellerController {
    private final BookRepository bookRepository;
    private final OrderRepository orderRepository;

    @GetMapping("/books")
    public List<Book> myBooks(Authentication authentication) {
        return bookRepository.findBySellerEmail(authentication.getName());
    }

    @GetMapping("/analytics")
    public Map<String, Object> analytics(Authentication authentication) {
        List<Book> sellerBooks = bookRepository.findBySellerEmail(authentication.getName());
        Map<String, Book> byId = sellerBooks.stream().collect(Collectors.toMap(Book::getId, b -> b));
        Map<String, Integer> soldQtyByBook = new HashMap<>();
        Map<String, BigDecimal> revenueByBook = new HashMap<>();

        for (Order order : orderRepository.findAll()) {
            for (Order.OrderItem item : order.getItems()) {
                if (byId.containsKey(item.getBookId())) {
                    soldQtyByBook.merge(item.getBookId(), item.getQuantity(), Integer::sum);
                    revenueByBook.merge(item.getBookId(), item.getSubtotal(), BigDecimal::add);
                }
            }
        }

        int totalSoldUnits = soldQtyByBook.values().stream().mapToInt(Integer::intValue).sum();
        BigDecimal totalRevenue = revenueByBook.values().stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        List<Map<String, Object>> topBooks = sellerBooks.stream()
                .map(book -> Map.<String, Object>of(
                        "bookId", book.getId(),
                        "title", book.getTitle(),
                        "soldUnits", soldQtyByBook.getOrDefault(book.getId(), 0),
                        "revenue", revenueByBook.getOrDefault(book.getId(), BigDecimal.ZERO)))
                .sorted((a, b) -> Integer.compare((int) b.get("soldUnits"), (int) a.get("soldUnits")))
                .limit(5)
                .toList();
        List<Map<String, Object>> lowStock = sellerBooks.stream()
                .filter(b -> b.getStock() != null && b.getStock() <= 5)
                .map(book -> Map.<String, Object>of(
                        "bookId", book.getId(),
                        "title", book.getTitle(),
                        "stock", book.getStock()))
                .toList();

        return Map.of(
                "bookCount", sellerBooks.size(),
                "totalSoldUnits", totalSoldUnits,
                "totalRevenue", totalRevenue,
                "topBooks", topBooks,
                "lowStock", lowStock
        );
    }
}
