package com.belledonne.ecommerce.controller;

import com.belledonne.ecommerce.dto.response.ApiResponse;
import com.belledonne.ecommerce.security.UserPrincipal;
import com.belledonne.ecommerce.service.CouponService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/coupons")
@RequiredArgsConstructor
@Tag(name = "Coupons", description = "Coupon validation and listing")
public class CouponController {

    private final CouponService couponService;

    @GetMapping
    public ResponseEntity<ApiResponse<?>> getActiveCoupons(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success("Active coupons", couponService.getActiveCoupons()));
    }

    @PostMapping("/validate")
    public ResponseEntity<ApiResponse<?>> validate(
        @AuthenticationPrincipal UserPrincipal principal,
        @RequestBody Map<String, Object> body) {
        String code = (String) body.get("code");
        BigDecimal cartTotal = new BigDecimal(body.get("cartTotal").toString());
        return ResponseEntity.ok(ApiResponse.success("Coupon validated",
            couponService.validateCoupon(code, cartTotal)));
    }
}
