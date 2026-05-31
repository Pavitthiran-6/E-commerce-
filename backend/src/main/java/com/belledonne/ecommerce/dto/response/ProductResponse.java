package com.belledonne.ecommerce.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ProductResponse {
    private UUID id;
    private String name;
    private String slug;
    private String brand;
    private String categoryName;
    private Long categoryId;
    private String description;
    private String shortDescription;
    private BigDecimal price;
    private BigDecimal originalPrice;
    private Integer discountPercentage;
    private Integer stockQuantity;
    private Boolean isActive;
    private Boolean isFeatured;
    private Boolean isNew;
    private String arrivalTag;
    private Boolean isBestseller;
    private BigDecimal averageRating;
    private Integer reviewCount;
    private String[] tags;
    private String[] images;
    private String image;
    private String[] colors;
    private String[] sizes;
    private String materialsTitle;
    private String materialsContent;
    private String shippingTitle;
    private String shippingContent;
    private String careTitle;
    private String careContent;
    private String sustainabilityTitle;
    private String sustainabilityContent;
    private String craftsmanshipTitle;
    private String craftsmanshipContent;
    private Boolean freeShipping;
    private Boolean codAvailable;
    private Boolean easyReturns;
    private Boolean inStock;
    private Boolean isApparelHighlights;
    private Boolean isTechHome;
    private Boolean isOnSale;
    private List<VariantResponse> variants;
    private List<SpecificationDTO> specifications;
    private LocalDateTime createdAt;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class VariantResponse {
        private Long id;
        private String size;
        private String color;
        private String colorHex;
        private Integer stockQuantity;
        private BigDecimal additionalPrice;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class SpecificationDTO {
        private String key;
        private String value;
        private int displayOrder;
    }
}
