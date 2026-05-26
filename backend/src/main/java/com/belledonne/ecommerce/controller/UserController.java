package com.belledonne.ecommerce.controller;

import com.belledonne.ecommerce.dto.request.ChangePasswordRequest;
import com.belledonne.ecommerce.dto.request.UpdateProfileRequest;
import com.belledonne.ecommerce.dto.response.ApiResponse;
import com.belledonne.ecommerce.security.UserPrincipal;
import com.belledonne.ecommerce.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
@Tag(name = "User", description = "User profile management")
public class UserController {

    private final UserService userService;

    @GetMapping("/profile")
    @Operation(summary = "Get logged-in user profile")
    public ResponseEntity<ApiResponse<?>> getProfile(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success("Profile fetched", userService.getProfile(principal)));
    }

    @PutMapping("/profile")
    @Operation(summary = "Update user profile")
    public ResponseEntity<ApiResponse<?>> updateProfile(
        @AuthenticationPrincipal UserPrincipal principal,
        @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Profile updated", userService.updateProfile(principal, request)));
    }

    @PutMapping("/change-password")
    @Operation(summary = "Change password")
    public ResponseEntity<ApiResponse<?>> changePassword(
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(principal, request);
        return ResponseEntity.ok(ApiResponse.success("Password changed successfully"));
    }

    @DeleteMapping("/account")
    @Operation(summary = "Delete user account")
    public ResponseEntity<ApiResponse<?>> deleteAccount(@AuthenticationPrincipal UserPrincipal principal) {
        userService.deleteAccount(principal);
        return ResponseEntity.ok(ApiResponse.success("Account deleted successfully"));
    }
}
