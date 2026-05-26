package com.belledonne.ecommerce.controller;

import com.belledonne.ecommerce.dto.request.ReviewRequest;
import com.belledonne.ecommerce.dto.response.ApiResponse;
import com.belledonne.ecommerce.security.UserPrincipal;
import com.belledonne.ecommerce.service.ReviewService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
@Tag(name = "Reviews", description = "Product reviews")
public class ReviewController {

    private final ReviewService reviewService;

    @GetMapping("/product/{productId}")
    public ResponseEntity<ApiResponse<?>> getProductReviews(
        @PathVariable UUID productId,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success("Reviews fetched",
            reviewService.getProductReviews(productId, PageRequest.of(page, size))));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<?>> addReview(
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody ReviewRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Review added", reviewService.addReview(principal, request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> updateReview(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable Long id,
        @Valid @RequestBody ReviewRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Review updated", reviewService.updateReview(principal, id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> deleteReview(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable Long id) {
        reviewService.deleteReview(principal, id);
        return ResponseEntity.ok(ApiResponse.success("Review deleted"));
    }
}
