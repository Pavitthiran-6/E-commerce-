package com.belledonne.ecommerce.dto.request;

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

    /** Selected size (e.g. "M", "42") — stored as string on cart_items */
    private String size;

    /** Selected color (e.g. "black") — stored as string on cart_items */
    private String color;
}
