package com.belledonne.ecommerce.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.util.UUID;

@Data
public class CartItemRequest {
    @NotNull
    private UUID productId;
    private Long variantId;
    @NotNull @Positive
    private Integer quantity;
}
