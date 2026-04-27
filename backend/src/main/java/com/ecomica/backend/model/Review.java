package com.ecomica.backend.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "reviews")
@CompoundIndex(def = "{'userId': 1, 'bookId': 1}", unique = true)
public class Review {
    @Id
    private String id;
    private String userId;
    private String bookId;
    private Integer rating;
    private String comment;
    private Instant createdAt;
}
