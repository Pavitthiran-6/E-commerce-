package com.belledonne.ecommerce.service;

import com.belledonne.ecommerce.entity.ShippingSettings;
import com.belledonne.ecommerce.repository.ShippingSettingsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class ShippingSettingsService {

    private final ShippingSettingsRepository repository;

    /**
     * Gets current shipping configuration. Defaults to threshold=999 and charge=79 if not present.
     */
    public ShippingSettings getOrCreate() {
        List<ShippingSettings> list = repository.findAll();
        if (!list.isEmpty()) {
            return list.get(0);
        }

        // Initialize defaults
        log.info("[ShippingSettingsService] No shipping configuration found, creating defaults (Threshold: 499, Charge: 79)");
        ShippingSettings settings = ShippingSettings.builder()
                .freeShippingThreshold(new BigDecimal("499.00"))
                .shippingCharge(new BigDecimal("79.00"))
                .build();
        return repository.save(settings);
    }

    /**
     * Updates shipping configuration.
     */
    public ShippingSettings updateSettings(BigDecimal freeShippingThreshold, BigDecimal shippingCharge) {
        if (freeShippingThreshold == null || freeShippingThreshold.compareTo(BigDecimal.ZERO) < 0) {
            throw new com.belledonne.ecommerce.exception.BadRequestException("Free shipping threshold must be greater than or equal to 0.");
        }
        if (shippingCharge == null || shippingCharge.compareTo(BigDecimal.ZERO) < 0) {
            throw new com.belledonne.ecommerce.exception.BadRequestException("Shipping charge must be greater than or equal to 0.");
        }

        ShippingSettings settings = getOrCreate();
        settings.setFreeShippingThreshold(freeShippingThreshold);
        settings.setShippingCharge(shippingCharge);
        log.info("[ShippingSettingsService] Shipping settings updated to: Threshold={}, Charge={}", freeShippingThreshold, shippingCharge);
        return repository.save(settings);
    }
}
