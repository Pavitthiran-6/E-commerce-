package com.belledonne.ecommerce.service;

import com.belledonne.ecommerce.dto.request.CartItemRequest;
import com.belledonne.ecommerce.dto.response.CartResponse;
import com.belledonne.ecommerce.entity.*;
import com.belledonne.ecommerce.exception.BadRequestException;
import com.belledonne.ecommerce.exception.ResourceNotFoundException;
import com.belledonne.ecommerce.repository.*;
import com.belledonne.ecommerce.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public CartResponse getCart(UserPrincipal principal) {
        Cart cart = getOrCreateCart(principal);
        return toResponse(cart);
    }

    public CartResponse addItem(UserPrincipal principal, CartItemRequest request) {
        Cart cart = getOrCreateCart(principal);
        Product product = productRepository.findById(request.getProductId())
            .orElseThrow(() -> new ResourceNotFoundException("Product", "id", request.getProductId()));

        BigDecimal price = product.getPrice();
        if (request.getVariantId() != null) {
            product.getVariants().stream()
                .filter(v -> v.getId().equals(request.getVariantId()))
                .findFirst()
                .ifPresent(v -> price.add(v.getAdditionalPrice()));
        }

        cartItemRepository.findByCartIdAndProductIdAndVariantId(
            cart.getId(), request.getProductId(), request.getVariantId())
            .ifPresentOrElse(
                existing -> existing.setQuantity(existing.getQuantity() + request.getQuantity()),
                () -> {
                    CartItem item = CartItem.builder()
                        .cart(cart)
                        .product(product)
                        .quantity(request.getQuantity())
                        .priceAtAddition(product.getPrice())
                        .build();
                    cart.getItems().add(cartItemRepository.save(item));
                }
            );
        return toResponse(cart);
    }

    public CartResponse updateItem(UserPrincipal principal, Long itemId, Integer quantity) {
        Cart cart = getOrCreateCart(principal);
        CartItem item = cartItemRepository.findById(itemId)
            .orElseThrow(() -> new ResourceNotFoundException("CartItem", "id", itemId));
        if (!item.getCart().getId().equals(cart.getId())) {
            throw new BadRequestException("Item does not belong to your cart");
        }
        if (quantity <= 0) {
            cartItemRepository.delete(item);
        } else {
            item.setQuantity(quantity);
            cartItemRepository.save(item);
        }
        return toResponse(cartRepository.findById(cart.getId()).orElse(cart));
    }

    public CartResponse removeItem(UserPrincipal principal, Long itemId) {
        return updateItem(principal, itemId, 0);
    }

    public void clearCart(UserPrincipal principal) {
        Cart cart = getOrCreateCart(principal);
        cartItemRepository.deleteByCartId(cart.getId());
        cart.getItems().clear();
    }

    public int getCount(UserPrincipal principal) {
        return getOrCreateCart(principal).getItems().stream()
            .mapToInt(CartItem::getQuantity).sum();
    }

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
                String image = item.getProduct().getImages() != null && item.getProduct().getImages().length > 0
                    ? item.getProduct().getImages()[0] : null;
                String size = item.getVariant() != null ? item.getVariant().getSize() : null;
                String color = item.getVariant() != null ? item.getVariant().getColor() : null;
                BigDecimal total = item.getPriceAtAddition().multiply(BigDecimal.valueOf(item.getQuantity()));
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
