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
import java.util.HashMap;
import java.util.Map;
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
            userRepository.findByEmail(adminEmail).orElseGet(() -> userRepository.save(User.builder()
                    .name("Admin")
                    .email(adminEmail)
                    .passwordHash(passwordEncoder.encode(adminPassword))
                    .role(Role.ADMIN)
                    .blocked(false)
                    .createdAt(Instant.now())
                    .build()));
            userRepository.findByEmail("buyer@ecomica.com").orElseGet(() -> userRepository.save(User.builder()
                    .name("Demo Buyer")
                    .email("buyer@ecomica.com")
                    .passwordHash(passwordEncoder.encode("buyer123"))
                    .role(Role.BUYER)
                    .blocked(false)
                    .createdAt(Instant.now())
                    .build()));
            userRepository.findByEmail("seller@ecomica.com").orElseGet(() -> userRepository.save(User.builder()
                    .name("Demo Seller")
                    .email("seller@ecomica.com")
                    .passwordHash(passwordEncoder.encode("seller123"))
                    .role(Role.SELLER)
                    .blocked(false)
                    .createdAt(Instant.now())
                    .build()));

            if (categoryRepository.count() == 0) {
                categoryRepository.save(Category.builder().name("Novels").description("Fiction and literary works").build());
                categoryRepository.save(Category.builder().name("Education").description("Academic and exam books").build());
                categoryRepository.save(Category.builder().name("Comics").description("Graphic novels and comics").build());
                categoryRepository.save(Category.builder().name("Technology").description("Programming and tech books").build());
            }

            if (bookRepository.count() == 0) {
                Map<String, String> categoryMap = new HashMap<>();
                for (Category category : categoryRepository.findAll()) {
                    categoryMap.put(category.getName(), category.getId());
                }

                bookRepository.save(Book.builder()
                        .title("The Alchemist")
                        .author("Paulo Coelho")
                        .description("A classic inspirational novel about following dreams.")
                        .price(new BigDecimal("499"))
                        .stock(25)
                        .imageUrl("https://images-na.ssl-images-amazon.com/images/I/71aFt4+OTOL.jpg")
                        .categoryId(categoryMap.get("Novels"))
                        .sellerEmail("seller@ecomica.com")
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
                        .sellerEmail("seller@ecomica.com")
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
                        .sellerEmail("seller@ecomica.com")
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
                        .sellerEmail("seller@ecomica.com")
                        .active(true)
                        .moderationStatus("APPROVED")
                        .createdAt(Instant.now())
                        .build());
            }
        };
    }
}
