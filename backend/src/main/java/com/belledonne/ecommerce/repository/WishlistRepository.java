package com.belledonne.ecommerce.repository;

import com.belledonne.ecommerce.entity.Wishlist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WishlistRepository extends JpaRepository<Wishlist, Long> {
    List<Wishlist> findByUserId(UUID userId);
    Optional<Wishlist> findByUserIdAndProductId(UUID userId, UUID productId);
    boolean existsByUserIdAndProductId(UUID userId, UUID productId);
    void deleteByUserIdAndProductId(UUID userId, UUID productId);
    void deleteByUserId(UUID userId);
}
