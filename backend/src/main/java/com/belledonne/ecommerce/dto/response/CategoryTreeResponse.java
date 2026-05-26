package com.belledonne.ecommerce.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryTreeResponse {
    private Long id;
    private String name;
    private String slug;
    private String description;
    private String imageUrl;
    private List<CategoryTreeResponse> children;
}
