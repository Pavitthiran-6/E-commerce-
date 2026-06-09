package com.belledonne.ecommerce.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class InventoryAdjustmentRequest {
    @NotNull(message = "Product ID is required")
    private UUID productId;
    
    private Long variantId; // optional, only if adjusting a specific variant
    
    @NotNull(message = "New quantity is required")
    private Integer newQuantity;
    
    private String notes;
}
