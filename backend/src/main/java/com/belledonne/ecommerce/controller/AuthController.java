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
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "User registration, login, OTP, password reset")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "Register a new user", description = "Create a user account and return access token + user details")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Registration successful")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Validation or registration error")
    public ResponseEntity<ApiResponse<?>> register(@Valid @RequestBody RegisterRequest request, HttpServletResponse response) {
        AuthResponse authResponse = authService.register(request);
        if (authResponse.getRefreshToken() != null) {
            setRefreshTokenCookie(response, authResponse.getRefreshToken());
        }
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Registration successful", authResponse));
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

    @PostMapping("/refresh-token")
    @Operation(summary = "Refresh access token", description = "Generate a new short-lived access token using refresh token cookie")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Token refreshed successfully")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Refresh token invalid, blacklisted, or expired")
    public ResponseEntity<ApiResponse<?>> refreshToken(
        @CookieValue(name = "refreshToken", required = false) String refreshToken) {
        String newAccessToken = authService.refreshToken(refreshToken);
        return ResponseEntity.ok(ApiResponse.success("Access token refreshed", Map.of("accessToken", newAccessToken)));
    }

    @PostMapping("/logout")
    @Operation(summary = "Logout user", description = "Invalidate refresh token and clear HTTP cookie")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Logout successful")
    public ResponseEntity<ApiResponse<?>> logout(
        @CookieValue(name = "refreshToken", required = false) String refreshToken,
        HttpServletResponse response) {
        authService.logout(refreshToken);
        clearRefreshTokenCookie(response);
        return ResponseEntity.ok(ApiResponse.success("Logout successful"));
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Forgot password", description = "Send OTP to email for password reset")
    public ResponseEntity<ApiResponse<?>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request);
        return ResponseEntity.ok(ApiResponse.success("OTP sent to your email address"));
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
            .secure(false) // Set to true in production (HTTPS)
            .path("/")
            .maxAge(7 * 24 * 60 * 60) // 7 days
            .sameSite("Lax")
            .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private void clearRefreshTokenCookie(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from("refreshToken", "")
            .httpOnly(true)
            .secure(false)
            .path("/")
            .maxAge(0)
            .sameSite("Lax")
            .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }
}
