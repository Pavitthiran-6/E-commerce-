package com.belledonne.ecommerce.util;

import java.math.BigDecimal;
import java.math.RoundingMode;

public class PriceUtil {
    public static final BigDecimal GST_RATE = new BigDecimal("18");
    public static final BigDecimal FREE_SHIPPING_THRESHOLD = new BigDecimal("999");
    public static final BigDecimal SHIPPING_CHARGE = new BigDecimal("79");

    public static BigDecimal calculateGst(BigDecimal amount) {
        return amount.multiply(GST_RATE).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
    }

    public static BigDecimal calculateShipping(BigDecimal subtotal) {
        return subtotal.compareTo(FREE_SHIPPING_THRESHOLD) >= 0 ? BigDecimal.ZERO : SHIPPING_CHARGE;
    }

    public static BigDecimal round(BigDecimal amount) {
        return amount.setScale(2, RoundingMode.HALF_UP);
    }
}
