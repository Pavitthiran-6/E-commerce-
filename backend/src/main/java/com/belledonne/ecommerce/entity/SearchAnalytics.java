package com.belledonne.ecommerce.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "search_analytics")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SearchAnalytics {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "search_term", nullable = false, unique = true, length = 255)
    private String searchTerm;

    @Builder.Default
    @Column(name = "search_count", nullable = false)
    private Integer searchCount = 1;

    @Column(name = "last_searched_at", nullable = false)
    private LocalDateTime lastSearchedAt;
}
