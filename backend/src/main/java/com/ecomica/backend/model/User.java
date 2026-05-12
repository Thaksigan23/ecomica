package com.ecomica.backend.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "users")
public class User {
    @Id
    private String id;
    private String name;
    @Indexed(unique = true)
    private String email;
    private String phone;
    private String avatarUrl;
    /** Short reader bio (buyer-focused; editable on buyer profile). */
    private String bio;
    /** Comma-separated genres for recommendations copy (buyer). */
    private String favoriteGenres;
    /** Email / offers opt-in (buyer). */
    private Boolean newsletterOptIn;
    /** Public-facing shop title (seller). */
    private String storeName;
    /** Longer storefront story (seller). */
    private String storeDescription;
    /** Store site or social URL (seller). */
    private String storeWebsiteUrl;
    private String passwordHash;
    private Role role;
    private boolean blocked;
    private Instant createdAt;
    /** Loyalty balance (demo: incremented on checkout) */
    private Long loyaltyPoints;
}
