package com.belledonne.ecommerce.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CartResponse {
    private UUID cartId;
    private List<CartItemResponse> items;
    private BigDecimal subtotal;
    private int itemCount;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class CartItemResponse {
        private Long id;
        private UUID productId;
        private String productName;
        private String productImage;
        private String size;
        private String color;
        private BigDecimal unitPrice;
        private Integer quantity;
        private BigDecimal totalPrice;
    }
}
