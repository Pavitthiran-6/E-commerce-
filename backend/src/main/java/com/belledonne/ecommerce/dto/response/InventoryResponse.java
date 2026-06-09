package com.belledonne.ecommerce.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryResponse {
    private UUID productId;
    private String productName;
    private String slug;
    private String productImage;
    private Long variantId;
    private String size;
    private String color;
    private Integer stockQuantity;
    private Integer lowStockThreshold;
    private boolean isLowStock;
    private boolean isOutOfStock;
}
