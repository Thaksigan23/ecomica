package com.ecomica.backend;

import com.ecomica.backend.model.Book;
import com.ecomica.backend.model.Category;
import com.ecomica.backend.model.Role;
import com.ecomica.backend.model.User;
import com.ecomica.backend.repository.BookRepository;
import com.ecomica.backend.repository.CategoryRepository;
import com.ecomica.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.util.List;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.time.Instant;

@Configuration
@RequiredArgsConstructor
public class SeedConfig {
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final BookRepository bookRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${ADMIN_EMAIL:admin@ecomica.com}")
    private String adminEmail;
    @Value("${ADMIN_PASSWORD:admin123}")
    private String adminPassword;

    @Bean
    CommandLineRunner seedData() {
        return args -> {
            // Remove old demo identities so login hints stay accurate.
            userRepository.findByEmail("buyer@ecomica.com").ifPresent(userRepository::delete);
            userRepository.findByEmail("seller@ecomica.com").ifPresent(userRepository::delete);

            upsertDemoUser("Admin", adminEmail, adminPassword, Role.ADMIN);
            upsertDemoUser("Anjali Reader", "buyer2@ecomica.com", "buyer234", Role.BUYER);
            upsertDemoUser("Kavin Books", "seller2@ecomica.com", "seller234", Role.SELLER);

            if (categoryRepository.count() == 0) {
                categoryRepository.save(Category.builder().name("Novels").description("Fiction and literary works").build());
                categoryRepository.save(Category.builder().name("Education").description("Academic and exam books").build());
                categoryRepository.save(Category.builder().name("Comics").description("Graphic novels and comics").build());
                categoryRepository.save(Category.builder().name("Technology").description("Programming and tech books").build());
            }

            Map<String, String> categoryMap = new HashMap<>();
            for (Category category : categoryRepository.findAll()) {
                categoryMap.put(category.getName(), category.getId());
            }

            if (bookRepository.count() == 0) {
                bookRepository.save(Book.builder()
                        .title("The Alchemist")
                        .author("Paulo Coelho")
                        .description("A classic inspirational novel about following dreams.")
                        .price(new BigDecimal("499"))
                        .stock(25)
                        .imageUrl("https://images-na.ssl-images-amazon.com/images/I/71aFt4+OTOL.jpg")
                        .categoryId(categoryMap.get("Novels"))
                        .sellerEmail("seller2@ecomica.com")
                        .active(true)
                        .moderationStatus("APPROVED")
                        .createdAt(Instant.now())
                        .build());
                bookRepository.save(Book.builder()
                        .title("Spring Boot in Action")
                        .author("Craig Walls")
                        .description("Hands-on guide for building production-grade Spring Boot apps.")
                        .price(new BigDecimal("899"))
                        .stock(18)
                        .imageUrl("https://images-na.ssl-images-amazon.com/images/I/91M8xPIf10L.jpg")
                        .categoryId(categoryMap.get("Technology"))
                        .sellerEmail("seller2@ecomica.com")
                        .active(true)
                        .moderationStatus("APPROVED")
                        .createdAt(Instant.now())
                        .build());
                bookRepository.save(Book.builder()
                        .title("Atomic Habits")
                        .author("James Clear")
                        .description("Proven framework for improving habits every day.")
                        .price(new BigDecimal("650"))
                        .stock(40)
                        .imageUrl("https://images-na.ssl-images-amazon.com/images/I/91bYsX41DVL.jpg")
                        .categoryId(categoryMap.get("Education"))
                        .sellerEmail("seller2@ecomica.com")
                        .active(true)
                        .moderationStatus("APPROVED")
                        .createdAt(Instant.now())
                        .build());
                bookRepository.save(Book.builder()
                        .title("Naruto Vol. 1")
                        .author("Masashi Kishimoto")
                        .description("Manga volume introducing the journey of Naruto Uzumaki.")
                        .price(new BigDecimal("399"))
                        .stock(30)
                        .imageUrl("https://images-na.ssl-images-amazon.com/images/I/81o6oLfkWIL.jpg")
                        .categoryId(categoryMap.get("Comics"))
                        .sellerEmail("seller2@ecomica.com")
                        .active(true)
                        .moderationStatus("APPROVED")
                        .createdAt(Instant.now())
                        .build());
                bookRepository.save(Book.builder()
                        .title("Deep Work")
                        .author("Cal Newport")
                        .description("Strategies for focused success in a distracted world.")
                        .price(new BigDecimal("720"))
                        .stock(16)
                        .imageUrl("https://images-na.ssl-images-amazon.com/images/I/71QKQ9mwV7L.jpg")
                        .categoryId(categoryMap.get("Education"))
                        .sellerEmail("seller2@ecomica.com")
                        .active(true)
                        .moderationStatus("APPROVED")
                        .createdAt(Instant.now())
                        .build());
                bookRepository.save(Book.builder()
                        .title("Clean Code")
                        .author("Robert C. Martin")
                        .description("A handbook of agile software craftsmanship.")
                        .price(new BigDecimal("1100"))
                        .stock(12)
                        .imageUrl("https://images-na.ssl-images-amazon.com/images/I/41xShlnTZTL._SX374_BO1,204,203,200_.jpg")
                        .categoryId(categoryMap.get("Technology"))
                        .sellerEmail("seller2@ecomica.com")
                        .active(true)
                        .moderationStatus("APPROVED")
                        .createdAt(Instant.now())
                        .build());
                bookRepository.save(Book.builder()
                        .title("The Silent Patient")
                        .author("Alex Michaelides")
                        .description("A psychological thriller with a gripping twist.")
                        .price(new BigDecimal("540"))
                        .stock(21)
                        .imageUrl("https://images-na.ssl-images-amazon.com/images/I/81JJPDNlxSL.jpg")
                        .categoryId(categoryMap.get("Novels"))
                        .sellerEmail("seller2@ecomica.com")
                        .active(true)
                        .moderationStatus("APPROVED")
                        .createdAt(Instant.now())
                        .build());
            }

            ensureSellerBook(
                    "Deep Work",
                    "seller2@ecomica.com",
                    "Cal Newport",
                    "Strategies for focused success in a distracted world.",
                    new BigDecimal("720"),
                    16,
                    "https://images-na.ssl-images-amazon.com/images/I/71QKQ9mwV7L.jpg",
                    categoryMap.get("Education"));
            ensureSellerBook(
                    "Clean Code",
                    "seller2@ecomica.com",
                    "Robert C. Martin",
                    "A handbook of agile software craftsmanship.",
                    new BigDecimal("1100"),
                    12,
                    "https://images-na.ssl-images-amazon.com/images/I/41xShlnTZTL._SX374_BO1,204,203,200_.jpg",
                    categoryMap.get("Technology"));
            ensureSellerBook(
                    "The Silent Patient",
                    "seller2@ecomica.com",
                    "Alex Michaelides",
                    "A psychological thriller with a gripping twist.",
                    new BigDecimal("540"),
                    21,
                    "https://images-na.ssl-images-amazon.com/images/I/81JJPDNlxSL.jpg",
                    categoryMap.get("Novels"));
        };
    }

    private void upsertDemoUser(String name, String email, String password, Role role) {
        Optional<User> existing = userRepository.findByEmail(email);
        User user = existing.orElseGet(() -> User.builder().createdAt(Instant.now()).build());
        user.setName(name);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setRole(role);
        user.setBlocked(false);
        if (user.getCreatedAt() == null) {
            user.setCreatedAt(Instant.now());
        }
        userRepository.save(user);
    }

    private void ensureSellerBook(
            String title,
            String sellerEmail,
            String author,
            String description,
            BigDecimal price,
            int stock,
            String imageUrl,
            String categoryId
    ) {
        List<Book> sellerBooks = bookRepository.findBySellerEmail(sellerEmail);
        boolean exists = sellerBooks.stream().anyMatch(b -> title.equalsIgnoreCase(b.getTitle()));
        if (exists) return;

        bookRepository.save(Book.builder()
                .title(title)
                .author(author)
                .description(description)
                .price(price)
                .stock(stock)
                .imageUrl(imageUrl)
                .categoryId(categoryId)
                .sellerEmail(sellerEmail)
                .active(true)
                .moderationStatus("APPROVED")
                .createdAt(Instant.now())
                .build());
    }
}
