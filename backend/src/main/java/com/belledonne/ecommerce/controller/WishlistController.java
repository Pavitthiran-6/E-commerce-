package com.belledonne.ecommerce.controller;

import com.belledonne.ecommerce.dto.request.MergeWishlistRequest;
import com.belledonne.ecommerce.dto.response.ApiResponse;
import com.belledonne.ecommerce.security.UserPrincipal;
import com.belledonne.ecommerce.service.WishlistService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/wishlist")
@RequiredArgsConstructor
@Tag(name = "Wishlist", description = "Wishlist management")
public class WishlistController {

    private final WishlistService wishlistService;

    @GetMapping
    @Operation(summary = "Get authenticated user's wishlist")
    public ResponseEntity<ApiResponse<?>> getWishlist(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success("Wishlist fetched", wishlistService.getWishlist(principal)));
    }

    @PostMapping("/add")
    @Operation(summary = "Add product to wishlist (idempotent)")
    public ResponseEntity<ApiResponse<?>> addToWishlist(
        @AuthenticationPrincipal UserPrincipal principal,
        @RequestBody Map<String, UUID> body) {
        wishlistService.addToWishlist(principal, body.get("productId"));
        return ResponseEntity.ok(ApiResponse.success("Added to wishlist"));
    }

    @DeleteMapping("/remove/{productId}")
    @Operation(summary = "Remove product from wishlist")
    public ResponseEntity<ApiResponse<?>> removeFromWishlist(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID productId) {
        wishlistService.removeFromWishlist(principal, productId);
        return ResponseEntity.ok(ApiResponse.success("Removed from wishlist"));
    }

    @GetMapping("/check/{productId}")
    @Operation(summary = "Check if product is in wishlist")
    public ResponseEntity<ApiResponse<?>> check(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID productId) {
        return ResponseEntity.ok(ApiResponse.success("Check result",
            Map.of("inWishlist", wishlistService.checkInWishlist(principal, productId))));
    }

    @DeleteMapping("/clear")
    @Operation(summary = "Clear entire wishlist")
    public ResponseEntity<ApiResponse<?>> clearWishlist(@AuthenticationPrincipal UserPrincipal principal) {
        wishlistService.clearWishlist(principal);
        return ResponseEntity.ok(ApiResponse.success("Wishlist cleared"));
    }

    @PostMapping("/merge")
    @Operation(summary = "Merge guest localStorage wishlist into backend wishlist (call once after login)")
    public ResponseEntity<ApiResponse<?>> mergeGuestWishlist(
        @AuthenticationPrincipal UserPrincipal principal,
        @RequestBody MergeWishlistRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Wishlist merged",
            wishlistService.mergeGuestWishlist(principal, request)));
    }
}
