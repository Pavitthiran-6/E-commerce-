package com.belledonne.ecommerce.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDetailsAdminResponse {
    private UUID id;
    private String name;
    private String email;
    private String phone;
    private String role;
    private LocalDateTime createdAt;
    private LocalDateTime lastLoginAt;
    private Boolean isBlocked;
    private String blockedReason;
    private Integer failedLoginAttempts;
    private LocalDateTime accountLockedUntil;

    private List<AddressDTO> addresses;
    
    private long totalOrders;
    private BigDecimal totalAmountSpent;
    private Long totalReturns;
    private Long totalRefunds;
    private Double returnPercentage;
    private Boolean isHighReturnRisk;
    private List<OrderMinDTO> latestOrders;

    private int wishlistCount;
    private List<WishlistItemDTO> wishlistItems;

    private int cartCount;
    private List<CartItemDTO> cartItems;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AddressDTO {
        private Long id;
        private String fullName;
        private String phone;
        private String addressLine;
        private String city;
        private String state;
        private String country;
        private String postalCode;
        private Boolean isDefault;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderMinDTO {
        private UUID id;
        private String orderNumber;
        private LocalDateTime createdAt;
        private BigDecimal totalAmount;
        private String status;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WishlistItemDTO {
        private UUID id;
        private String name;
        private BigDecimal price;
        private String image;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CartItemDTO {
        private Long id;
        private UUID productId;
        private String productName;
        private int quantity;
        private BigDecimal price;
        private String image;
        private String size;
        private String color;
    }
}
