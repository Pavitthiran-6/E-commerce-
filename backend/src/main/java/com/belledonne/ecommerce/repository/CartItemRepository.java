package com.belledonne.ecommerce.repository;

import com.belledonne.ecommerce.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    Optional<CartItem> findByCartIdAndProductIdAndVariantId(UUID cartId, UUID productId, Long variantId);
    void deleteByCartId(UUID cartId);
}
