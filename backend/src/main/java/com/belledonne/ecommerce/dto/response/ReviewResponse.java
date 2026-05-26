package com.belledonne.ecommerce.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ReviewResponse {
    private Long id;
    private UUID productId;
    private String userName;
    private Integer rating;
    private String title;
    private String comment;
    private Boolean isVerifiedPurchase;
    private Boolean isApproved;
    private LocalDateTime createdAt;
}
