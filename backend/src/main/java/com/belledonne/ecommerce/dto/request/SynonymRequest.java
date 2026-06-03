package com.belledonne.ecommerce.dto.request;

import lombok.Data;

@Data
public class SynonymRequest {
    private String keyword;
    private String mappedTerm;
}
