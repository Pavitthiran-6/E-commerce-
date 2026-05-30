package com.belledonne.ecommerce.controller;

import com.belledonne.ecommerce.dto.response.ApiResponse;
import com.belledonne.ecommerce.dto.response.CouponResponse;
import com.belledonne.ecommerce.security.UserPrincipal;
import com.belledonne.ecommerce.service.CouponService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/coupons")
@RequiredArgsConstructor
@Tag(name = "Coupons", description = "Coupon validation and listing")
public class CouponController {

    private final CouponService couponService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CouponResponse>>> getActiveCoupons(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success("Active coupons", couponService.getActiveCoupons()));
    }

    @GetMapping("/available")
    public ResponseEntity<ApiResponse<List<CouponResponse>>> getAvailableCoupons(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success("Available coupons", couponService.getAvailableCoupons()));
    }

    @GetMapping("/featured")
    public ResponseEntity<ApiResponse<List<CouponResponse>>> getFeaturedCoupons() {
        return ResponseEntity.ok(ApiResponse.success("Featured coupons", couponService.getFeaturedCoupons()));
    }

    @PostMapping("/validate")
    public ResponseEntity<ApiResponse<?>> validate(
        @AuthenticationPrincipal UserPrincipal principal,
        @RequestParam(required = false) String code,
        @RequestParam(required = false) BigDecimal cartTotal,
        @RequestBody(required = false) Map<String, Object> body) {
        
        String finalCode = code;
        BigDecimal finalCartTotal = cartTotal;

        if (body != null) {
            if (finalCode == null && body.containsKey("code")) {
                finalCode = (String) body.get("code");
            }
            if (finalCartTotal == null && body.containsKey("cartTotal")) {
                finalCartTotal = new BigDecimal(body.get("cartTotal").toString());
            }
        }

        if (finalCode == null || finalCartTotal == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Coupon code and cart total are required"));
        }

        return ResponseEntity.ok(ApiResponse.success("Coupon validated",
            couponService.validateCoupon(finalCode, finalCartTotal, principal != null ? principal.getId() : null)));
    }
}
