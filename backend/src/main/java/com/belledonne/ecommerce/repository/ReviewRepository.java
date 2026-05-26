package com.belledonne.ecommerce.repository;

import com.belledonne.ecommerce.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long>, JpaSpecificationExecutor<Review> {
    Page<Review> findByProductIdAndIsApprovedTrueOrderByCreatedAtDesc(UUID productId, Pageable pageable);
    Optional<Review> findByProductIdAndUserId(UUID productId, UUID userId);
    boolean existsByProductIdAndUserId(UUID productId, UUID userId);

    Page<Review> findByIsApprovedFalseOrderByCreatedAtDesc(Pageable pageable);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.product.id = :productId AND r.isApproved = true")
    Double getAverageRating(UUID productId);

    @Query("SELECT COUNT(r) FROM Review r WHERE r.product.id = :productId AND r.isApproved = true")
    long getReviewCount(UUID productId);
}
