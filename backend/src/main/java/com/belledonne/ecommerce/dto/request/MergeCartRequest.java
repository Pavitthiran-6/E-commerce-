package com.belledonne.ecommerce.dto.request;

import lombok.Data;

import java.util.List;
import java.util.UUID;

/**
 * Request body for POST /api/cart/merge
 * Sent by the frontend after a guest user logs in to atomically
 * merge all localStorage cart items into the backend cart.
 */
@Data
public class MergeCartRequest {

    private List<GuestCartItem> items;

    @Data
    public static class GuestCartItem {
        private UUID productId;
        private Integer quantity;
        private String size;
        private String color;
    }
}
