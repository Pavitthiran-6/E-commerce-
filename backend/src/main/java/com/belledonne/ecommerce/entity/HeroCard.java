package com.belledonne.ecommerce.entity;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "hero_cards")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HeroCard {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String image;

    @Column(name = "discount_percentage")
    private Integer discountPercentage;

    @Column(name = "background_color", length = 100)
    private String backgroundColor;

    @Column(name = "display_order")
    private Integer displayOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hero_section_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @JsonIgnore
    private HeroSection heroSection;
}
