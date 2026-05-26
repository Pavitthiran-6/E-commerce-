package com.belledonne.ecommerce.dto.response;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String accessToken;

    @Builder.Default
    private String tokenType = "Bearer";

    private UserResponse user;

    @JsonIgnore
    private String refreshToken;
}
