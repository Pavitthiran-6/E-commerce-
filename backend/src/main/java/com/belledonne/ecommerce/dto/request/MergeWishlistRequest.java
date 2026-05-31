package com.belledonne.ecommerce.dto.request;

import lombok.Data;

import java.util.List;
import java.util.UUID;

/**
 * Request body for POST /api/wishlist/merge
 * Sent by the frontend after a guest user logs in to atomically
 * merge all localStorage wishlist product IDs into the backend wishlist.
 */
@Data
public class MergeWishlistRequest {

    /** List of product IDs the guest had saved in localStorage */
    private List<UUID> productIds;
}
