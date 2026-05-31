package com.belledonne.ecommerce.service;

import com.belledonne.ecommerce.dto.request.MergeWishlistRequest;
import com.belledonne.ecommerce.dto.response.ProductResponse;
import com.belledonne.ecommerce.entity.Product;
import com.belledonne.ecommerce.entity.User;
import com.belledonne.ecommerce.entity.Wishlist;
import com.belledonne.ecommerce.exception.ResourceNotFoundException;
import com.belledonne.ecommerce.repository.*;
import com.belledonne.ecommerce.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class WishlistService {

    private final WishlistRepository wishlistRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final ProductService productService;

    // ── Get Wishlist ──────────────────────────────────────────────────────────

    public List<ProductResponse> getWishlist(UserPrincipal principal) {
        return wishlistRepository.findByUserId(principal.getId()).stream()
            .map(w -> productService.toResponse(w.getProduct()))
            .collect(Collectors.toList());
    }

    // ── Add To Wishlist (idempotent — no exception on duplicate) ─────────────

    public void addToWishlist(UserPrincipal principal, UUID productId) {
        // Idempotent: if already exists, silently succeed
        if (wishlistRepository.existsByUserIdAndProductId(principal.getId(), productId)) {
            return;
        }
        User user = userRepository.findById(principal.getId())
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", principal.getId()));
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));
        wishlistRepository.save(Wishlist.builder().user(user).product(product).build());
    }

    // ── Remove From Wishlist ──────────────────────────────────────────────────

    public void removeFromWishlist(UserPrincipal principal, UUID productId) {
        wishlistRepository.deleteByUserIdAndProductId(principal.getId(), productId);
    }

    // ── Check In Wishlist ─────────────────────────────────────────────────────

    public boolean checkInWishlist(UserPrincipal principal, UUID productId) {
        return wishlistRepository.existsByUserIdAndProductId(principal.getId(), productId);
    }

    // ── Clear Wishlist ────────────────────────────────────────────────────────

    public void clearWishlist(UserPrincipal principal) {
        wishlistRepository.deleteByUserId(principal.getId());
    }

    // ── Merge Guest Wishlist (atomic, called once after login) ────────────────

    /**
     * Atomically merges a guest's localStorage wishlist into the authenticated
     * user's backend wishlist. Duplicate products are silently skipped.
     * Products not found in the catalogue are also skipped gracefully.
     *
     * @return merged wishlist as a list of ProductResponses
     */
    public List<ProductResponse> mergeGuestWishlist(UserPrincipal principal, MergeWishlistRequest request) {
        if (request.getProductIds() == null || request.getProductIds().isEmpty()) {
            return getWishlist(principal);
        }

        User user = userRepository.findById(principal.getId())
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", principal.getId()));

        for (UUID productId : request.getProductIds()) {
            if (productId == null) continue;

            // Skip if already in wishlist
            if (wishlistRepository.existsByUserIdAndProductId(principal.getId(), productId)) {
                continue;
            }

            productRepository.findById(productId).ifPresentOrElse(
                product -> wishlistRepository.save(
                    Wishlist.builder().user(user).product(product).build()
                ),
                () -> log.warn("Wishlist merge: product {} not found, skipping", productId)
            );
        }

        return getWishlist(principal);
    }
}
