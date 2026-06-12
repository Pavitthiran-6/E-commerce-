package com.belledonne.ecommerce.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "products")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(unique = true, nullable = false, length = 255)
    private String slug;

    @Column(length = 100)
    private String brand;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Category category;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "short_description", length = 500)
    private String shortDescription;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(name = "original_price", precision = 10, scale = 2)
    private BigDecimal originalPrice;

    @Column(name = "discount_percentage")
    @Builder.Default
    private Integer discountPercentage = 0;

    @Column(name = "stock_quantity")
    @Builder.Default
    private Integer stockQuantity = 0;

    @Column(name = "low_stock_threshold")
    @Builder.Default
    private Integer lowStockThreshold = 5;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "is_featured")
    @Builder.Default
    private Boolean isFeatured = false;

    @Column(name = "is_new")
    @Builder.Default
    private Boolean isNew = false;

    @Column(name = "arrival_tag", length = 50)
    private String arrivalTag;

    @Column(name = "is_bestseller")
    @Builder.Default
    private Boolean isBestseller = false;

    @Column(name = "is_apparel_highlights")
    @Builder.Default
    private Boolean isApparelHighlights = false;

    @Column(name = "is_tech_home")
    @Builder.Default
    private Boolean isTechHome = false;

    @Column(name = "is_on_sale")
    @Builder.Default
    private Boolean isOnSale = false;

    @Column(name = "average_rating", precision = 3, scale = 2)
    @Builder.Default
    private BigDecimal averageRating = BigDecimal.ZERO;

    @Column(name = "review_count")
    @Builder.Default
    private Integer reviewCount = 0;

    @Column(name = "tags")
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.ARRAY)
    private String[] tags;

    @Column(name = "keywords", columnDefinition = "TEXT")
    private String keywords;

    @Column(name = "images", columnDefinition = "TEXT ARRAY")
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.ARRAY)
    private String[] images;

    @Column(name = "colors")
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.ARRAY)
    private String[] colors;

    @Column(name = "sizes")
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.ARRAY)
    private String[] sizes;

    @Column(name = "materials_title", length = 100)
    private String materialsTitle;

    @Column(name = "materials_content", columnDefinition = "TEXT")
    private String materialsContent;

    @Column(name = "shipping_title", length = 100)
    private String shippingTitle;

    @Column(name = "shipping_content", columnDefinition = "TEXT")
    private String shippingContent;

    @Column(name = "care_title", length = 100)
    private String careTitle;

    @Column(name = "care_content", columnDefinition = "TEXT")
    private String careContent;

    @Column(name = "sustainability_title", length = 100)
    private String sustainabilityTitle;

    @Column(name = "sustainability_content", columnDefinition = "TEXT")
    private String sustainabilityContent;

    @Column(name = "craftsmanship_title", length = 100)
    private String craftsmanshipTitle;

    @Column(name = "craftsmanship_content", columnDefinition = "TEXT")
    private String craftsmanshipContent;

    @Column(name = "free_shipping")
    @Builder.Default
    private Boolean freeShipping = true;

    @Column(name = "shipping_charge", precision = 10, scale = 2)
    private BigDecimal shippingCharge;

    @Column(name = "weight", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal weight = BigDecimal.valueOf(0.5);

    // ─── Volumetric dimensions for Shiprocket (in cm) ────────────────────────────
    @Column(name = "length", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal length = BigDecimal.valueOf(10.0);

    @Column(name = "width", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal width = BigDecimal.valueOf(10.0);

    @Column(name = "height", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal height = BigDecimal.valueOf(10.0);

    @Column(name = "cod_available")
    @Builder.Default
    private Boolean codAvailable = true;

    @Column(name = "easy_returns")
    @Builder.Default
    private Boolean easyReturns = true;

    @Column(name = "in_stock")
    @Builder.Default
    private Boolean inStock = true;

    // ─── Dynamic product specifications (stored as JSONB) ────────────────────────
    @Column(name = "specifications")
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.JSON)
    @Builder.Default
    private List<SpecificationEntry> specifications = new ArrayList<>();

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @Builder.Default
    private List<ProductVariant> variants = new ArrayList<>();

    // ─── Inner DTO for specification key-value pair
    // ───────────────────────────────
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class SpecificationEntry {
        private String key;
        private String value;
        private int displayOrder;
    }

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @Builder.Default
    private List<Review> reviews = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
