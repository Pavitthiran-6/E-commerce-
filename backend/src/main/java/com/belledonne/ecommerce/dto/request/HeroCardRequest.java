package com.belledonne.ecommerce.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class HeroCardRequest {
    private Long id;

    @NotBlank(message = "Card title is required")
    private String title;

    private String image;

    private Integer discountPercentage;

    private String backgroundColor;

    private Integer displayOrder;
}
