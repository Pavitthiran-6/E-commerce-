package com.belledonne.ecommerce.controller;

import com.belledonne.ecommerce.dto.request.CartItemRequest;
import com.belledonne.ecommerce.dto.request.MergeCartRequest;
import com.belledonne.ecommerce.dto.response.ApiResponse;
import com.belledonne.ecommerce.security.UserPrincipal;
import com.belledonne.ecommerce.service.CartService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
@Tag(name = "Cart", description = "Shopping cart management")
public class CartController {

    private final CartService cartService;

    @GetMapping
    @Operation(summary = "Get authenticated user's cart")
    public ResponseEntity<ApiResponse<?>> getCart(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success("Cart fetched", cartService.getCart(principal)));
    }

    @PostMapping("/add")
    @Operation(summary = "Add item to cart (with size and color)")
    public ResponseEntity<ApiResponse<?>> addItem(
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody CartItemRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Item added to cart", cartService.addItem(principal, request)));
    }

    @PutMapping("/update/{itemId}")
    @Operation(summary = "Update cart item quantity")
    public ResponseEntity<ApiResponse<?>> updateItem(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable Long itemId,
        @RequestBody Map<String, Integer> body) {
        return ResponseEntity.ok(ApiResponse.success("Cart updated",
            cartService.updateItem(principal, itemId, body.get("quantity"))));
    }

    @DeleteMapping("/remove/{itemId}")
    @Operation(summary = "Remove item from cart by cart-item ID")
    public ResponseEntity<ApiResponse<?>> removeItem(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable Long itemId) {
        return ResponseEntity.ok(ApiResponse.success("Item removed", cartService.removeItem(principal, itemId)));
    }

    @DeleteMapping("/clear")
    @Operation(summary = "Clear all items from cart")
    public ResponseEntity<ApiResponse<?>> clearCart(@AuthenticationPrincipal UserPrincipal principal) {
        cartService.clearCart(principal);
        return ResponseEntity.ok(ApiResponse.success("Cart cleared"));
    }

    @GetMapping("/count")
    @Operation(summary = "Get total item count in cart")
    public ResponseEntity<ApiResponse<?>> getCount(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success("Cart count", Map.of("count", cartService.getCount(principal))));
    }

    @PostMapping("/merge")
    @Operation(summary = "Merge guest localStorage cart into backend cart (call once after login)")
    public ResponseEntity<ApiResponse<?>> mergeGuestCart(
        @AuthenticationPrincipal UserPrincipal principal,
        @RequestBody MergeCartRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Cart merged", cartService.mergeGuestCart(principal, request)));
    }
}
