package com.belledonne.ecommerce.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class OrderRequest {
    @NotNull
    private Long addressId;
    @NotBlank
    private String paymentMethod;
    private String couponCode;
    private List<OrderItemRequest> items;

    @Data
    public static class OrderItemRequest {
        private UUID productId;
        private Long variantId;
        private Integer quantity;
    }
}
