package com.belledonne.ecommerce.service;

import com.belledonne.ecommerce.dto.request.CartItemRequest;
import com.belledonne.ecommerce.dto.request.MergeCartRequest;
import com.belledonne.ecommerce.dto.response.CartResponse;
import com.belledonne.ecommerce.entity.*;
import com.belledonne.ecommerce.exception.BadRequestException;
import com.belledonne.ecommerce.exception.ResourceNotFoundException;
import com.belledonne.ecommerce.repository.*;
import com.belledonne.ecommerce.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    // ── Get Cart ──────────────────────────────────────────────────────────────

    public CartResponse getCart(UserPrincipal principal) {
        Cart cart = getOrCreateCart(principal);
        return toResponse(cart);
    }

    // ── Add Item ──────────────────────────────────────────────────────────────

    public CartResponse addItem(UserPrincipal principal, CartItemRequest request) {
        Cart cart = getOrCreateCart(principal);
        Product product = productRepository.findById(request.getProductId())
            .orElseThrow(() -> new ResourceNotFoundException("Product", "id", request.getProductId()));

        String size  = request.getSize()  != null ? request.getSize().trim()  : null;
        String color = request.getColor() != null ? request.getColor().trim() : null;

        // Dedup: find existing item by product + size + color
        Optional<CartItem> existing = cartItemRepository
            .findByCartIdAndProductIdAndSizeAndColor(cart.getId(), request.getProductId(), size, color);

        if (existing.isPresent()) {
            // Increment quantity
            CartItem item = existing.get();
            item.setQuantity(item.getQuantity() + request.getQuantity());
            cartItemRepository.save(item);
        } else {
            CartItem item = CartItem.builder()
                .cart(cart)
                .product(product)
                .size(size)
                .color(color)
                .quantity(request.getQuantity())
                .priceAtAddition(product.getPrice())
                .build();
            cart.getItems().add(cartItemRepository.save(item));
        }
        return toResponse(cartRepository.findById(cart.getId()).orElse(cart));
    }

    // ── Update Item ───────────────────────────────────────────────────────────

    public CartResponse updateItem(UserPrincipal principal, Long itemId, Integer quantity) {
        Cart cart = getOrCreateCart(principal);
        CartItem item = cartItemRepository.findById(itemId)
            .orElseThrow(() -> new ResourceNotFoundException("CartItem", "id", itemId));

        if (!item.getCart().getId().equals(cart.getId())) {
            throw new BadRequestException("Item does not belong to your cart");
        }
        if (quantity <= 0) {
            cart.getItems().remove(item);
            cartItemRepository.delete(item);
        } else {
            item.setQuantity(quantity);
            cartItemRepository.save(item);
        }
        return toResponse(cartRepository.findById(cart.getId()).orElse(cart));
    }

    // ── Remove Item ───────────────────────────────────────────────────────────

    public CartResponse removeItem(UserPrincipal principal, Long itemId) {
        return updateItem(principal, itemId, 0);
    }

    // ── Clear Cart ────────────────────────────────────────────────────────────

    public void clearCart(UserPrincipal principal) {
        Cart cart = getOrCreateCart(principal);
        cartItemRepository.deleteByCartId(cart.getId());
        cart.getItems().clear();
    }

    // ── Get Count ─────────────────────────────────────────────────────────────

    public int getCount(UserPrincipal principal) {
        return getOrCreateCart(principal).getItems().stream()
            .mapToInt(CartItem::getQuantity).sum();
    }

    // ── Merge Guest Cart (atomic, called once after login) ────────────────────

    /**
     * Atomically merges a guest's localStorage cart into the authenticated user's
     * backend cart. Uses a "take max quantity" conflict resolution strategy:
     * if the product+size+color already exists in the backend cart, we keep
     * whichever quantity is higher.
     *
     * This is the same strategy used by Amazon and Flipkart.
     */
    public CartResponse mergeGuestCart(UserPrincipal principal, MergeCartRequest request) {
        if (request.getItems() == null || request.getItems().isEmpty()) {
            return getCart(principal);
        }

        Cart cart = getOrCreateCart(principal);

        for (MergeCartRequest.GuestCartItem guestItem : request.getItems()) {
            if (guestItem.getProductId() == null || guestItem.getQuantity() == null
                    || guestItem.getQuantity() <= 0) {
                continue; // skip malformed items
            }

            Product product = productRepository.findById(guestItem.getProductId())
                .orElse(null);
            if (product == null) {
                log.warn("Cart merge: product {} not found, skipping", guestItem.getProductId());
                continue;
            }

            String size  = guestItem.getSize()  != null ? guestItem.getSize().trim()  : null;
            String color = guestItem.getColor() != null ? guestItem.getColor().trim() : null;

            Optional<CartItem> existing = cartItemRepository
                .findByCartIdAndProductIdAndSizeAndColor(cart.getId(), guestItem.getProductId(), size, color);

            if (existing.isPresent()) {
                // Take the higher quantity (user may have added more on web than on mobile)
                CartItem item = existing.get();
                int merged = Math.max(item.getQuantity(), guestItem.getQuantity());
                item.setQuantity(merged);
                cartItemRepository.save(item);
            } else {
                CartItem item = CartItem.builder()
                    .cart(cart)
                    .product(product)
                    .size(size)
                    .color(color)
                    .quantity(guestItem.getQuantity())
                    .priceAtAddition(product.getPrice())
                    .build();
                cart.getItems().add(cartItemRepository.save(item));
            }
        }

        return toResponse(cartRepository.findById(cart.getId()).orElse(cart));
    }

    // ── Internal helpers ──────────────────────────────────────────────────────

    private Cart getOrCreateCart(UserPrincipal principal) {
        return cartRepository.findByUserId(principal.getId()).orElseGet(() -> {
            User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", principal.getId()));
            return cartRepository.save(Cart.builder().user(user).build());
        });
    }

    public CartResponse toResponse(Cart cart) {
        List<CartResponse.CartItemResponse> itemResponses = cart.getItems().stream()
            .map(item -> {
                String image = item.getProduct().getImages() != null
                    && item.getProduct().getImages().length > 0
                    ? item.getProduct().getImages()[0] : null;

                // Use denormalized size/color strings (preferred) — fallback to variant if set
                String size  = item.getSize()  != null ? item.getSize()
                    : (item.getVariant() != null ? item.getVariant().getSize()  : null);
                String color = item.getColor() != null ? item.getColor()
                    : (item.getVariant() != null ? item.getVariant().getColor() : null);

                BigDecimal total = item.getPriceAtAddition()
                    .multiply(BigDecimal.valueOf(item.getQuantity()));

                return CartResponse.CartItemResponse.builder()
                    .id(item.getId())
                    .productId(item.getProduct().getId())
                    .productName(item.getProduct().getName())
                    .productImage(image)
                    .size(size)
                    .color(color)
                    .unitPrice(item.getPriceAtAddition())
                    .quantity(item.getQuantity())
                    .totalPrice(total)
                    .freeShipping(item.getProduct().getFreeShipping())
                    .shippingCharge(item.getProduct().getShippingCharge())
                    .weight(item.getProduct().getWeight())
                    .build();
            }).collect(Collectors.toList());

        BigDecimal subtotal = itemResponses.stream()
            .map(CartResponse.CartItemResponse::getTotalPrice)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        return CartResponse.builder()
            .cartId(cart.getId())
            .items(itemResponses)
            .subtotal(subtotal)
            .itemCount(itemResponses.size())
            .build();
    }
}
