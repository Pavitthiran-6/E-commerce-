package com.belledonne.ecommerce.service;

import com.belledonne.ecommerce.dto.response.ProductResponse;
import com.belledonne.ecommerce.entity.Product;
import com.belledonne.ecommerce.entity.User;
import com.belledonne.ecommerce.entity.Wishlist;
import com.belledonne.ecommerce.exception.BadRequestException;
import com.belledonne.ecommerce.exception.ResourceNotFoundException;
import com.belledonne.ecommerce.repository.*;
import com.belledonne.ecommerce.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class WishlistService {

    private final WishlistRepository wishlistRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final ProductService productService;

    public List<ProductResponse> getWishlist(UserPrincipal principal) {
        return wishlistRepository.findByUserId(principal.getId()).stream()
            .map(w -> productService.toResponse(w.getProduct()))
            .collect(Collectors.toList());
    }

    public void addToWishlist(UserPrincipal principal, UUID productId) {
        if (wishlistRepository.existsByUserIdAndProductId(principal.getId(), productId)) {
            throw new BadRequestException("Product is already in your wishlist");
        }
        User user = userRepository.findById(principal.getId())
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", principal.getId()));
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));
        wishlistRepository.save(Wishlist.builder().user(user).product(product).build());
    }

    public void removeFromWishlist(UserPrincipal principal, UUID productId) {
        wishlistRepository.deleteByUserIdAndProductId(principal.getId(), productId);
    }

    public boolean checkInWishlist(UserPrincipal principal, UUID productId) {
        return wishlistRepository.existsByUserIdAndProductId(principal.getId(), productId);
    }

    public void clearWishlist(UserPrincipal principal) {
        wishlistRepository.deleteByUserId(principal.getId());
    }
}
