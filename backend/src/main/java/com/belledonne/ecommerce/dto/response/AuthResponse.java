package com.belledonne.ecommerce.dto.response;

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

    // refreshToken is intentionally included in the JSON response body.
    // The backend ALSO sends it as an HttpOnly cookie (set in AuthController).
    // The frontend stores it in localStorage so the Axios interceptor can use
    // it for proactive token refresh. The cookie provides a fallback when
    // localStorage is unavailable or the token was cleared unexpectedly.
    private String refreshToken;
}
