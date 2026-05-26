package com.belledonne.ecommerce.service;

import com.belledonne.ecommerce.dto.request.ReviewRequest;
import com.belledonne.ecommerce.dto.response.ReviewResponse;
import com.belledonne.ecommerce.entity.Product;
import com.belledonne.ecommerce.entity.Review;
import com.belledonne.ecommerce.entity.User;
import com.belledonne.ecommerce.exception.BadRequestException;
import com.belledonne.ecommerce.exception.ResourceNotFoundException;
import com.belledonne.ecommerce.repository.*;
import com.belledonne.ecommerce.security.UserPrincipal;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final OrderItemRepository orderItemRepository;

    public Page<ReviewResponse> getProductReviews(UUID productId, Pageable pageable) {
        return reviewRepository.findByProductIdAndIsApprovedTrueOrderByCreatedAtDesc(productId, pageable)
            .map(this::toResponse);
    }

    public ReviewResponse addReview(UserPrincipal principal, ReviewRequest request) {
        if (reviewRepository.existsByProductIdAndUserId(request.getProductId(), principal.getId())) {
            throw new BadRequestException("You have already reviewed this product");
        }
        boolean hasPurchased = !orderItemRepository
            .findDeliveredByUserAndProduct(principal.getId(), request.getProductId()).isEmpty();

        User user = userRepository.findById(principal.getId())
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", principal.getId()));
        Product product = productRepository.findById(request.getProductId())
            .orElseThrow(() -> new ResourceNotFoundException("Product", "id", request.getProductId()));

        Review review = Review.builder()
            .product(product).user(user)
            .rating(request.getRating()).title(request.getTitle()).comment(request.getComment())
            .isVerifiedPurchase(hasPurchased).isApproved(false) // Wait! Review defaults to false for approval in Part 5, so admin approves it
            .build();
        Review saved = reviewRepository.save(review);
        updateProductRating(request.getProductId());
        return toResponse(saved);
    }

    public ReviewResponse updateReview(UserPrincipal principal, Long reviewId, ReviewRequest request) {
        Review review = reviewRepository.findById(reviewId)
            .orElseThrow(() -> new ResourceNotFoundException("Review", "id", reviewId));
        if (!review.getUser().getId().equals(principal.getId()))
            throw new BadRequestException("You can only edit your own reviews");
        review.setRating(request.getRating());
        review.setTitle(request.getTitle());
        review.setComment(request.getComment());
        Review saved = reviewRepository.save(review);
        updateProductRating(review.getProduct().getId());
        return toResponse(saved);
    }

    public void deleteReview(UserPrincipal principal, Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
            .orElseThrow(() -> new ResourceNotFoundException("Review", "id", reviewId));
        if (!review.getUser().getId().equals(principal.getId()))
            throw new BadRequestException("You can only delete your own reviews");
        UUID productId = review.getProduct().getId();
        reviewRepository.delete(review);
        updateProductRating(productId);
    }

    // Admin Methods
    public Page<ReviewResponse> getReviewsAdmin(Boolean approved, UUID productId, Integer rating, Pageable pageable) {
        Specification<Review> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (approved != null) {
                predicates.add(cb.equal(root.get("isApproved"), approved));
            }
            if (productId != null) {
                predicates.add(cb.equal(root.get("product").get("id"), productId));
            }
            if (rating != null) {
                predicates.add(cb.equal(root.get("rating"), rating));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        return reviewRepository.findAll(spec, pageable).map(this::toResponse);
    }

    public Page<ReviewResponse> getPendingReviews(Pageable pageable) {
        return reviewRepository.findByIsApprovedFalseOrderByCreatedAtDesc(pageable).map(this::toResponse);
    }

    public ReviewResponse approveReview(Long id, boolean approved) {
        Review review = reviewRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Review", "id", id));
        review.setIsApproved(approved);
        Review saved = reviewRepository.save(review);
        updateProductRating(review.getProduct().getId());
        return toResponse(saved);
    }

    public void deleteReviewAdmin(Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
            .orElseThrow(() -> new ResourceNotFoundException("Review", "id", reviewId));
        UUID productId = review.getProduct().getId();
        reviewRepository.delete(review);
        updateProductRating(productId);
    }

    private void updateProductRating(UUID productId) {
        productRepository.findById(productId).ifPresent(product -> {
            Double avg = reviewRepository.getAverageRating(productId);
            long count = reviewRepository.getReviewCount(productId);
            product.setAverageRating(avg != null ?
                BigDecimal.valueOf(avg).setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO);
            product.setReviewCount((int) count);
            productRepository.save(product);
        });
    }

    public ReviewResponse toResponse(Review r) {
        return ReviewResponse.builder()
            .id(r.getId()).productId(r.getProduct().getId())
            .userName(r.getUser().getName()).rating(r.getRating())
            .title(r.getTitle()).comment(r.getComment())
            .isVerifiedPurchase(r.getIsVerifiedPurchase())
            .isApproved(r.getIsApproved())
            .createdAt(r.getCreatedAt())
            .build();
    }
}
