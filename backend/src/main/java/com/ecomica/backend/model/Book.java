package com.ecomica.backend.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "books")
public class Book {
    @Id
    private String id;
    @Indexed
    private String title;
    @Indexed
    private String author;
    private String description;
    private BigDecimal price;
    private Integer stock;
    private String imageUrl;
    private String pdfUrl;
    @Indexed
    private String categoryId;
    private String sellerEmail;
    private boolean active;
    private String moderationStatus;
    private Instant createdAt;
}
