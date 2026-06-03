package com.belledonne.ecommerce.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ProductRequest {
    @NotBlank(message = "Product name is required")
    private String name;

    private String slug;

    private String brand;

    private Long categoryId;

    private String description;

    private String shortDescription;

    @NotNull(message = "Price is required")
    private BigDecimal price;

    private BigDecimal originalPrice;

    private Integer discountPercentage;

    private Integer stockQuantity;

    private String[] tags;

    private String keywords;

    private String[] colors;

    private String[] sizes;

    private String[] images;

    private Boolean isNew;

    private Boolean isBestseller;

    private Boolean inStock;

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

    private Boolean isApparelHighlights;

    private Boolean isTechHome;

    private Boolean isOnSale;

    private java.util.List<SpecificationDTO> specifications;

    @lombok.Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class SpecificationDTO {
        private String key;
        private String value;
        private int displayOrder;
    }
}
