package com.belledonne.ecommerce.repository;

import com.belledonne.ecommerce.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Long> {

    /** Find by cart + product + variant (legacy) */
    Optional<CartItem> findByCartIdAndProductIdAndVariantId(UUID cartId, UUID productId, Long variantId);

    /** Find by cart + product + size + color strings (primary dedup key) */
    Optional<CartItem> findByCartIdAndProductIdAndSizeAndColor(UUID cartId, UUID productId, String size, String color);

    void deleteByCartId(UUID cartId);
}
