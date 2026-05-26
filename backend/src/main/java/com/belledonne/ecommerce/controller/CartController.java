package com.belledonne.ecommerce.controller;

import com.belledonne.ecommerce.dto.request.CartItemRequest;
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
    public ResponseEntity<ApiResponse<?>> getCart(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success("Cart fetched", cartService.getCart(principal)));
    }

    @PostMapping("/add")
    public ResponseEntity<ApiResponse<?>> addItem(
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody CartItemRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Item added to cart", cartService.addItem(principal, request)));
    }

    @PutMapping("/update/{itemId}")
    public ResponseEntity<ApiResponse<?>> updateItem(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable Long itemId,
        @RequestBody Map<String, Integer> body) {
        return ResponseEntity.ok(ApiResponse.success("Cart updated",
            cartService.updateItem(principal, itemId, body.get("quantity"))));
    }

    @DeleteMapping("/remove/{itemId}")
    public ResponseEntity<ApiResponse<?>> removeItem(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable Long itemId) {
        return ResponseEntity.ok(ApiResponse.success("Item removed", cartService.removeItem(principal, itemId)));
    }

    @DeleteMapping("/clear")
    public ResponseEntity<ApiResponse<?>> clearCart(@AuthenticationPrincipal UserPrincipal principal) {
        cartService.clearCart(principal);
        return ResponseEntity.ok(ApiResponse.success("Cart cleared"));
    }

    @GetMapping("/count")
    public ResponseEntity<ApiResponse<?>> getCount(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success("Cart count", Map.of("count", cartService.getCount(principal))));
    }
}
