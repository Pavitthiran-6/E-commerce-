package com.belledonne.ecommerce.controller;

import com.belledonne.ecommerce.dto.request.*;
import com.belledonne.ecommerce.dto.response.ApiResponse;
import com.belledonne.ecommerce.dto.response.AuthResponse;
import com.belledonne.ecommerce.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;

import java.util.Map;


@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "User registration, login, OTP, password reset")
public class AuthController {

    private final AuthService authService;

    /**
     * Controls whether the refresh token cookie is sent with Secure flag.
     * Set COOKIE_SECURE=false only in local HTTP development environments.
     * Defaults to true for production safety.
     */
    @Value("${COOKIE_SECURE:true}")
    private boolean cookieSecure;

    @PostMapping("/register")
    @Operation(summary = "Register a new user (Verification OTP request)", description = "Initiate registration by validating details and sending verification OTP")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Verification code sent")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Validation or registration error")
    public ResponseEntity<ApiResponse<?>> register(@Valid @RequestBody RegisterRequest request) {
        String msg = authService.register(request);
        return ResponseEntity.ok(ApiResponse.success(msg));
    }

    @PostMapping("/verify-registration")
    @Operation(summary = "Verify registration OTP", description = "Verify OTP to finalize user creation and return access token")
    public ResponseEntity<ApiResponse<?>> verifyRegistration(@Valid @RequestBody VerifyRegistrationRequest request, HttpServletResponse response) {
        AuthResponse authResponse = authService.verifyRegistration(request);
        if (authResponse.getRefreshToken() != null) {
            setRefreshTokenCookie(response, authResponse.getRefreshToken());
        }
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Email verified successfully", authResponse));
    }

    @PostMapping("/resend-registration-otp")
    @Operation(summary = "Resend registration OTP", description = "Resend a new registration OTP code to user's email")
    public ResponseEntity<ApiResponse<?>> resendRegistrationOtp(@Valid @RequestBody ResendRegistrationOtpRequest request) {
        String msg = authService.resendRegistrationOtp(request);
        return ResponseEntity.ok(ApiResponse.success(msg));
    }

    @PostMapping("/login")
    @Operation(summary = "Login user", description = "Authenticate user and return JWT token")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Login successful")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Invalid credentials")
    public ResponseEntity<ApiResponse<?>> login(@Valid @RequestBody LoginRequest request, HttpServletResponse response) {
        AuthResponse authResponse = authService.login(request);
        if (authResponse.getRefreshToken() != null) {
            setRefreshTokenCookie(response, authResponse.getRefreshToken());
        }
        return ResponseEntity.ok(ApiResponse.success("Login successful", authResponse));
    }

    @PostMapping("/google")
    @Operation(summary = "Google OAuth login/signup", description = "Verify Google ID Token, login/signup user, and return JWT token")
    public ResponseEntity<ApiResponse<?>> googleLogin(@Valid @RequestBody GoogleLoginRequest request, HttpServletResponse response) {
        AuthResponse authResponse = authService.googleLogin(request);
        if (authResponse.getRefreshToken() != null) {
            setRefreshTokenCookie(response, authResponse.getRefreshToken());
        }
        return ResponseEntity.ok(ApiResponse.success("Login successful", authResponse));
    }

    @PostMapping({"/refresh", "/refresh-token"})
    @Operation(summary = "Refresh access token", description = "Generate a new short-lived access token using refresh token")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Token refreshed successfully")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Refresh token invalid, blacklisted, or expired")
    public ResponseEntity<ApiResponse<?>> refresh(
        @CookieValue(name = "refreshToken", required = false) String cookieRefreshToken,
        @Valid @RequestBody(required = false) TokenRefreshRequest request) {
        
        String token = null;
        if (request != null && request.getRefreshToken() != null && !request.getRefreshToken().isBlank()) {
            token = request.getRefreshToken();
        } else if (cookieRefreshToken != null && !cookieRefreshToken.isBlank()) {
            token = cookieRefreshToken;
        }
        
        if (token == null || token.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("Refresh token is missing"));
        }
        
        String newAccessToken = authService.refreshToken(token);
        return ResponseEntity.ok(ApiResponse.success("Access token refreshed", Map.of("accessToken", newAccessToken)));
    }

    @PostMapping("/logout")
    @Operation(summary = "Logout user", description = "Invalidate refresh token and clear HTTP cookie")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Logout successful")
    public ResponseEntity<ApiResponse<?>> logout(
        @CookieValue(name = "refreshToken", required = false) String cookieRefreshToken,
        @RequestBody(required = false) Map<String, String> body,
        HttpServletResponse response) {

        // Prefer the token from the request body (sent by frontend alongside the cookie).
        // Fall back to the cookie if the body token is absent.
        // This handles cases where SameSite/cross-origin rules prevent the cookie from
        // being sent automatically (e.g. different subdomains).
        String refreshToken = null;
        if (body != null) {
            String bodyToken = body.get("refreshToken");
            if (bodyToken != null && !bodyToken.isBlank()) {
                refreshToken = bodyToken;
            }
        }
        if (refreshToken == null && cookieRefreshToken != null && !cookieRefreshToken.isBlank()) {
            refreshToken = cookieRefreshToken;
        }

        authService.logout(refreshToken);
        clearRefreshTokenCookie(response);
        return ResponseEntity.ok(ApiResponse.success("Logout successful"));
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Forgot password", description = "Send OTP to email for password reset")
    public ResponseEntity<ApiResponse<?>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        String msg = authService.forgotPassword(request);
        return ResponseEntity.ok(ApiResponse.success(msg));
    }

    @PostMapping("/verify-otp")
    @Operation(summary = "Verify reset OTP", description = "Verify that the password reset OTP is correct")
    public ResponseEntity<ApiResponse<?>> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        authService.verifyOtp(request);
        return ResponseEntity.ok(ApiResponse.success("OTP verified successfully"));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Reset password", description = "Reset password with OTP verification code")
    public ResponseEntity<ApiResponse<?>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(ApiResponse.success("Password reset successfully"));
    }

    private void setRefreshTokenCookie(HttpServletResponse response, String refreshToken) {
        ResponseCookie cookie = ResponseCookie.from("refreshToken", refreshToken)
            .httpOnly(true)
            .secure(cookieSecure)  // Set COOKIE_SECURE=false only for local HTTP development
            .path("/")
            .maxAge(30 * 24 * 60 * 60) // 30 days — must match jwt.refresh-token-expiry
            .sameSite("Strict")
            .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private void clearRefreshTokenCookie(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from("refreshToken", "")
            .httpOnly(true)
            .secure(cookieSecure)
            .path("/")
            .maxAge(0)
            .sameSite("Strict")
            .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }
}
