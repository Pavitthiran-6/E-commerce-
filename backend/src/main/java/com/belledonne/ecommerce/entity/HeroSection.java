package com.belledonne.ecommerce.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "hero_sections")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HeroSection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(length = 50)
    private String badge;

    @Column(name = "date_range", length = 100)
    private String dateRange;

    @Column(name = "background_color", length = 200)
    private String backgroundColor;

    @Column(name = "left_icon", columnDefinition = "TEXT")
    private String leftIcon;

    @Column(name = "right_icon", columnDefinition = "TEXT")
    private String rightIcon;

    // Featured Product fields
    @Column(name = "featured_product_name", length = 255)
    private String featuredProductName;

    @Column(name = "featured_product_image", columnDefinition = "TEXT")
    private String featuredProductImage;

    @Column(name = "featured_original_price", precision = 10, scale = 2)
    private BigDecimal featuredOriginalPrice;

    @Column(name = "featured_sale_price", precision = 10, scale = 2)
    private BigDecimal featuredSalePrice;

    @Column(name = "featured_discount_percentage")
    private Integer featuredDiscountPercentage;

    @Column(name = "featured_card_background_color", length = 100)
    private String featuredCardBackgroundColor;

    @Column(name = "product_slug", length = 255)
    private String productSlug;

    @OneToMany(mappedBy = "heroSection", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @Builder.Default
    @OrderBy("displayOrder ASC")
    private List<HeroCard> promoCards = new ArrayList<>();
}
