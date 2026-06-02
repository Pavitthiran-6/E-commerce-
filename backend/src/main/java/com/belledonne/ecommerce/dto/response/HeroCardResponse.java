package com.belledonne.ecommerce.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HeroCardResponse {
    private Long id;
    private String title;
    private String image;
    private Integer discountPercentage;
    private String backgroundColor;
    private Integer displayOrder;
}
