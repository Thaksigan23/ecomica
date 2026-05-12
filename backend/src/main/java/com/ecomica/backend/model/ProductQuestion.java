package com.ecomica.backend.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "product_questions")
public class ProductQuestion {
    @Id
    private String id;
    private String bookId;
    private String askerUserId;
    private String askerName;
    private String question;
    private String answer;
    private String answeredBy;
    private Instant createdAt;
    private Instant answeredAt;
}
