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
}
