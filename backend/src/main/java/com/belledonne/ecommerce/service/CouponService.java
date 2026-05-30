package com.belledonne.ecommerce.service;

import com.belledonne.ecommerce.dto.request.CouponRequest;
import com.belledonne.ecommerce.dto.response.CouponResponse;
import com.belledonne.ecommerce.entity.Coupon;
import com.belledonne.ecommerce.enums.OrderStatus;
import com.belledonne.ecommerce.exception.CouponException;
import com.belledonne.ecommerce.exception.ResourceNotFoundException;
import com.belledonne.ecommerce.repository.CouponRepository;
import com.belledonne.ecommerce.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class CouponService {

    private final CouponRepository couponRepository;
    private final OrderRepository orderRepository;

    public List<CouponResponse> getActiveCoupons() {
        return getAvailableCoupons();
    }

    public List<CouponResponse> getAvailableCoupons() {
        LocalDateTime now = LocalDateTime.now();
        return couponRepository.findAll()
            .stream()
            .filter(coupon -> Boolean.TRUE.equals(coupon.getIsActive()))
            .filter(coupon -> coupon.getValidUntil() == null || coupon.getValidUntil().isAfter(now))
            .filter(coupon -> coupon.getUsageLimit() == null || (coupon.getUsedCount() != null && coupon.getUsedCount() < coupon.getUsageLimit()))
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    public List<Coupon> getAllCouponsAdmin() {
        return couponRepository.findAll();
    }

    public Coupon createCoupon(CouponRequest request) {
        if (couponRepository.findByCodeIgnoreCase(request.getCode()).isPresent()) {
            throw new CouponException("Coupon with code '" + request.getCode() + "' already exists");
        }
        Coupon coupon = Coupon.builder()
            .code(request.getCode().toUpperCase().trim())
            .description(request.getDescription())
            .type(request.getType().toUpperCase().trim())
            .value(request.getValue())
            .minCartValue(request.getMinCartValue() != null ? request.getMinCartValue() : BigDecimal.ZERO)
            .maxDiscount(request.getMaxDiscount())
            .usageLimit(request.getUsageLimit())
            .isActive(true)
            .showOnHome(request.getShowOnHome() != null ? request.getShowOnHome() : false)
            .validFrom(request.getValidFrom())
            .validUntil(request.getValidUntil())
            .build();
        return couponRepository.save(coupon);
    }

    public Coupon updateCoupon(Long id, CouponRequest request) {
        Coupon coupon = couponRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Coupon", "id", id));
        
        // Check code uniqueness if changed
        if (!coupon.getCode().equalsIgnoreCase(request.getCode())) {
            if (couponRepository.findByCodeIgnoreCase(request.getCode()).isPresent()) {
                throw new CouponException("Coupon with code '" + request.getCode() + "' already exists");
            }
            coupon.setCode(request.getCode().toUpperCase().trim());
        }

        coupon.setDescription(request.getDescription());
        coupon.setType(request.getType().toUpperCase().trim());
        coupon.setValue(request.getValue());
        coupon.setMinCartValue(request.getMinCartValue() != null ? request.getMinCartValue() : BigDecimal.ZERO);
        coupon.setMaxDiscount(request.getMaxDiscount());
        coupon.setUsageLimit(request.getUsageLimit());
        if (request.getShowOnHome() != null) {
            coupon.setShowOnHome(request.getShowOnHome());
        }
        coupon.setValidFrom(request.getValidFrom());
        coupon.setValidUntil(request.getValidUntil());

        return couponRepository.save(coupon);
    }

    public void deleteCoupon(Long id) {
        Coupon coupon = couponRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Coupon", "id", id));
        couponRepository.delete(coupon);
    }

    public Coupon toggleCoupon(Long id) {
        Coupon coupon = couponRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Coupon", "id", id));
        coupon.setIsActive(!coupon.getIsActive());
        return couponRepository.save(coupon);
    }

    public Map<String, Object> validateCoupon(String code, BigDecimal cartTotal) {
        return validateCoupon(code, cartTotal, null);
    }

    public Map<String, Object> validateCoupon(String code, BigDecimal cartTotal, UUID userId) {
        Coupon coupon = couponRepository.findByCodeIgnoreCase(code)
            .orElseThrow(() -> new CouponException("Coupon code '" + code + "' is not valid"));

        if (!coupon.getIsActive()) throw new CouponException("This coupon is not available");
        if (coupon.getValidFrom() != null && LocalDateTime.now().isBefore(coupon.getValidFrom()))
            throw new CouponException("This coupon is not yet valid");
        if (coupon.getValidUntil() != null && LocalDateTime.now().isAfter(coupon.getValidUntil()))
            throw new CouponException("This coupon has expired");
        if (coupon.getMinCartValue() != null && cartTotal.compareTo(coupon.getMinCartValue()) < 0) {
            String formattedVal = java.text.NumberFormat.getNumberInstance(new java.util.Locale("en", "IN")).format(coupon.getMinCartValue());
            throw new CouponException("Minimum order value is ₹" + formattedVal + " for this coupon");
        }
        if (coupon.getUsageLimit() != null && (coupon.getUsedCount() != null && coupon.getUsedCount() >= coupon.getUsageLimit()))
            throw new CouponException("This coupon has reached its usage limit");

        // Enforce e-commerce rule: one usage per user (excluding cancelled orders)
        if (userId != null && orderRepository.existsByUserIdAndCouponCodeIgnoreCaseAndStatusNot(userId, code, OrderStatus.CANCELLED)) {
            throw new CouponException("You have already used this coupon code '" + code.toUpperCase() + "' once");
        }

        BigDecimal discount = calculateDiscount(coupon, cartTotal);
        return Map.of(
            "valid", true,
            "discountAmount", discount,
            "message", "Coupon applied! You save ₹" + discount,
            "coupon", toResponse(coupon)
        );
    }

    private BigDecimal calculateDiscount(Coupon coupon, BigDecimal cartTotal) {
        BigDecimal discount = switch (coupon.getType().toUpperCase()) {
            case "PERCENTAGE" -> cartTotal.multiply(coupon.getValue())
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            case "FLAT" -> coupon.getValue();
            case "FREE_SHIPPING" -> BigDecimal.valueOf(79); // shipping charge
            default -> BigDecimal.ZERO;
        };
        if (coupon.getMaxDiscount() != null && discount.compareTo(coupon.getMaxDiscount()) > 0) {
            discount = coupon.getMaxDiscount();
        }
        return discount.min(cartTotal);
    }

    public void incrementUsage(String code) {
        couponRepository.findByCodeIgnoreCase(code).ifPresent(c -> {
            c.setUsedCount((c.getUsedCount() != null ? c.getUsedCount() : 0) + 1);
            couponRepository.save(c);
        });
    }

    public Coupon toggleShowOnHome(Long id) {
        Coupon coupon = couponRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Coupon", "id", id));
        boolean currentStatus = coupon.getShowOnHome() != null && coupon.getShowOnHome();
        coupon.setShowOnHome(!currentStatus);
        return couponRepository.save(coupon);
    }

    public List<CouponResponse> getFeaturedCoupons() {
        LocalDateTime now = LocalDateTime.now();
        return couponRepository.findAll()
            .stream()
            .filter(coupon -> Boolean.TRUE.equals(coupon.getIsActive()))
            .filter(coupon -> Boolean.TRUE.equals(coupon.getShowOnHome()))
            .filter(coupon -> coupon.getValidUntil() == null || coupon.getValidUntil().isAfter(now))
            .filter(coupon -> coupon.getUsageLimit() == null || (coupon.getUsedCount() != null && coupon.getUsedCount() < coupon.getUsageLimit()))
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    public CouponResponse toResponse(Coupon c) {
        String discountType = c.getType();
        if ("FLAT".equalsIgnoreCase(discountType)) {
            discountType = "FIXED";
        } else if ("PERCENTAGE".equalsIgnoreCase(discountType)) {
            discountType = "PERCENTAGE";
        }
        return CouponResponse.builder()
            .code(c.getCode())
            .description(c.getDescription())
            .minOrderValue(c.getMinCartValue() != null ? c.getMinCartValue() : BigDecimal.ZERO)
            .discountType(discountType)
            .discountValue(c.getValue())
            .showOnHome(c.getShowOnHome() != null && c.getShowOnHome())
            .build();
    }
}
