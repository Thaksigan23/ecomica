package com.ecomica.backend.controller;

import com.ecomica.backend.model.Book;
import com.ecomica.backend.model.ProductQuestion;
import com.ecomica.backend.model.User;
import com.ecomica.backend.repository.BookRepository;
import com.ecomica.backend.repository.ProductQuestionRepository;
import com.ecomica.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/books/{bookId}/questions")
@RequiredArgsConstructor
@CrossOrigin
public class BookQuestionController {
    private final ProductQuestionRepository productQuestionRepository;
    private final BookRepository bookRepository;
    private final UserRepository userRepository;

    @GetMapping
    public List<ProductQuestion> list(@PathVariable String bookId) {
        assertPublicBook(bookId);
        return productQuestionRepository.findByBookIdOrderByCreatedAtDesc(bookId);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('BUYER','ADMIN')")
    public ProductQuestion ask(Authentication authentication, @PathVariable String bookId, @RequestBody Map<String, String> body) {
        assertPublicBook(bookId);
        String q = body.getOrDefault("question", "").trim();
        if (q.length() < 4) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Question too short");
        }
        User u = userRepository.findByEmailIgnoreCase(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        ProductQuestion pq = ProductQuestion.builder()
                .bookId(bookId)
                .askerUserId(authentication.getName())
                .askerName(u.getName())
                .question(q.length() > 800 ? q.substring(0, 800) : q)
                .createdAt(Instant.now())
                .build();
        return productQuestionRepository.save(pq);
    }

    @PatchMapping("/{questionId}/answer")
    @PreAuthorize("hasAnyRole('SELLER','ADMIN')")
    public ProductQuestion answer(
            Authentication authentication,
            @PathVariable String bookId,
            @PathVariable String questionId,
            @RequestBody Map<String, String> body
    ) {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Book not found"));
        boolean isAdmin = authentication.getAuthorities().stream().anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
        if (!isAdmin && (book.getSellerEmail() == null || !book.getSellerEmail().equalsIgnoreCase(authentication.getName()))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only answer for your own listings");
        }
        ProductQuestion pq = productQuestionRepository.findById(questionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Question not found"));
        if (!bookId.equals(pq.getBookId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Question does not belong to this book");
        }
        String ans = body.getOrDefault("answer", "").trim();
        if (ans.length() < 2) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Answer too short");
        }
        pq.setAnswer(ans.length() > 2000 ? ans.substring(0, 2000) : ans);
        pq.setAnsweredBy(authentication.getName());
        pq.setAnsweredAt(Instant.now());
        return productQuestionRepository.save(pq);
    }

    private void assertPublicBook(String bookId) {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Book not found"));
        boolean approved = book.getModerationStatus() == null || book.getModerationStatus().isBlank()
                || "APPROVED".equalsIgnoreCase(book.getModerationStatus());
        if (!book.isActive() || !approved) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Book is not publicly available");
        }
    }
}
