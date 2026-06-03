package com.belledonne.ecommerce.controller;

import com.belledonne.ecommerce.dto.response.ApiResponse;
import com.belledonne.ecommerce.dto.response.UserAdminResponse;
import com.belledonne.ecommerce.dto.response.UserDetailsAdminResponse;
import com.belledonne.ecommerce.entity.*;
import com.belledonne.ecommerce.exception.ResourceNotFoundException;
import com.belledonne.ecommerce.repository.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin Users", description = "Admin user management endpoints")
public class AdminUserController {

    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final WishlistRepository wishlistRepository;
    private final CartRepository cartRepository;

    @GetMapping
    @Operation(summary = "Get all registered users with metrics (paginated & searchable)")
    public ResponseEntity<ApiResponse<Page<UserAdminResponse>>> getUsers(
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        
        Pageable pageable = PageRequest.of(page, size);
        Page<UserAdminResponse> users = userRepository.findUsersWithMetrics(search.trim(), pageable);
        return ResponseEntity.ok(ApiResponse.success("Users fetched successfully", users));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get full user details view for admin")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<UserDetailsAdminResponse>> getUserDetails(@PathVariable UUID id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));

        // 1. Map Addresses
        java.util.List<UserDetailsAdminResponse.AddressDTO> addressDTOs = user.getAddresses().stream()
            .map(addr -> UserDetailsAdminResponse.AddressDTO.builder()
                .id(addr.getId())
                .fullName(addr.getFullName())
                .phone(addr.getPhone())
                .addressLine(addr.getAddressLine1() + (addr.getAddressLine2() != null && !addr.getAddressLine2().isBlank() ? ", " + addr.getAddressLine2() : ""))
                .city(addr.getCity())
                .state(addr.getState())
                .country("India")
                .postalCode(addr.getPincode())
                .isDefault(addr.getIsDefault())
                .build())
            .collect(Collectors.toList());

        // 2. Map Orders
        long totalOrders = orderRepository.countByUserId(id);
        BigDecimal totalSpent = orderRepository.sumTotalAmountByUserId(id);
        if (totalSpent == null) totalSpent = BigDecimal.ZERO;
        
        java.util.List<UserDetailsAdminResponse.OrderMinDTO> orderDTOs = orderRepository.findByUserIdOrderByCreatedAtDesc(id, PageRequest.of(0, 5))
            .getContent().stream()
            .map(o -> UserDetailsAdminResponse.OrderMinDTO.builder()
                .id(o.getId())
                .orderNumber(o.getOrderNumber())
                .createdAt(o.getCreatedAt())
                .totalAmount(o.getTotalAmount())
                .status(o.getStatus() != null ? o.getStatus().name() : "PLACED")
                .build())
            .collect(Collectors.toList());

        // 3. Map Wishlist
        java.util.List<Wishlist> wishlists = wishlistRepository.findByUserId(id);
        int wishlistCount = wishlists.size();
        java.util.List<UserDetailsAdminResponse.WishlistItemDTO> wishlistDTOs = wishlists.stream()
            .map(w -> {
                Product p = w.getProduct();
                String img = p.getImages() != null && p.getImages().length > 0 ? p.getImages()[0] : null;
                return UserDetailsAdminResponse.WishlistItemDTO.builder()
                    .id(p.getId())
                    .name(p.getName())
                    .price(p.getPrice())
                    .image(img)
                    .build();
            })
            .collect(Collectors.toList());

        // 4. Map Cart
        Optional<Cart> cartOpt = cartRepository.findByUserId(id);
        int cartCount = 0;
        java.util.List<UserDetailsAdminResponse.CartItemDTO> cartDTOs = new ArrayList<>();
        if (cartOpt.isPresent()) {
            Cart cart = cartOpt.get();
            cartCount = cart.getItems().stream().mapToInt(CartItem::getQuantity).sum();
            cartDTOs = cart.getItems().stream()
                .map(ci -> {
                    Product p = ci.getProduct();
                    String img = p.getImages() != null && p.getImages().length > 0 ? p.getImages()[0] : null;
                    return UserDetailsAdminResponse.CartItemDTO.builder()
                        .id(ci.getId())
                        .productId(p.getId())
                        .productName(p.getName())
                        .quantity(ci.getQuantity())
                        .price(ci.getPriceAtAddition())
                        .image(img)
                        .size(ci.getSize())
                        .color(ci.getColor())
                        .build();
                })
                .collect(Collectors.toList());
        }

        // 5. Build DTO
        UserDetailsAdminResponse details = UserDetailsAdminResponse.builder()
            .id(user.getId())
            .name(user.getName())
            .email(user.getEmail())
            .phone(user.getPhone())
            .role(user.getRole() != null ? user.getRole().name() : "ROLE_USER")
            .createdAt(user.getCreatedAt())
            .lastLoginAt(user.getLastLoginAt())
            .isBlocked(user.getIsBlocked())
            .blockedReason(user.getBlockedReason())
            .addresses(addressDTOs)
            .totalOrders(totalOrders)
            .totalAmountSpent(totalSpent)
            .latestOrders(orderDTOs)
            .wishlistCount(wishlistCount)
            .wishlistItems(wishlistDTOs)
            .cartCount(cartCount)
            .cartItems(cartDTOs)
            .build();

        return ResponseEntity.ok(ApiResponse.success("User details fetched successfully", details));
    }

    @PutMapping("/{id}/toggle-block")
    @Operation(summary = "Toggle a user's block status")
    public ResponseEntity<ApiResponse<?>> toggleBlock(
            @PathVariable UUID id,
            @RequestBody(required = false) Map<String, String> body) {
        
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        
        boolean currentlyBlocked = user.getIsBlocked() != null && user.getIsBlocked();
        if (currentlyBlocked) {
            user.setIsBlocked(false);
            user.setBlockedReason(null);
        } else {
            user.setIsBlocked(true);
            String reason = body != null ? body.get("reason") : null;
            user.setBlockedReason(reason != null && !reason.isBlank() ? reason.trim() : "Blocked by administrator");
        }
        
        userRepository.save(user);
        
        String action = user.getIsBlocked() ? "blocked" : "unblocked";
        return ResponseEntity.ok(ApiResponse.success("User successfully " + action, user));
    }
}
