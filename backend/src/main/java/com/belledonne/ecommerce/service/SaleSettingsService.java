package com.belledonne.ecommerce.service;

import com.belledonne.ecommerce.dto.request.SaleSettingsRequest;
import com.belledonne.ecommerce.dto.response.SaleSettingsResponse;
import com.belledonne.ecommerce.entity.Product;
import com.belledonne.ecommerce.entity.SaleSettings;
import com.belledonne.ecommerce.repository.ProductRepository;
import com.belledonne.ecommerce.repository.SaleSettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class SaleSettingsService {

    private final SaleSettingsRepository saleSettingsRepository;
    private final ProductRepository productRepository;

    public SaleSettings getOrCreate() {
        return saleSettingsRepository.findFirstByOrderByIdAsc().orElseGet(() -> {
            SaleSettings defaults = SaleSettings.builder()
                .saleTitle("SALE IS LIVE 🔥")
                .saleSubtitle("Limited time deals — up to 70% off on selected products!")
                .maxDiscountText("up to 70% off")
                .saleEndDateTime(LocalDateTime.now().plusDays(7))
                .isActive(true)
                .build();
            return saleSettingsRepository.save(defaults);
        });
    }

    public SaleSettingsResponse getResponse() {
        SaleSettings settings = getOrCreate();
        return toResponse(settings);
    }

    public SaleSettingsResponse updateSettings(SaleSettingsRequest request) {
        SaleSettings settings = getOrCreate();
        if (request.getSaleTitle() != null) settings.setSaleTitle(request.getSaleTitle());
        if (request.getSaleSubtitle() != null) settings.setSaleSubtitle(request.getSaleSubtitle());
        if (request.getMaxDiscountText() != null) settings.setMaxDiscountText(request.getMaxDiscountText());
        if (request.getSaleEndDateTime() != null) settings.setSaleEndDateTime(request.getSaleEndDateTime());
        if (request.getIsActive() != null) settings.setIsActive(request.getIsActive());
        return toResponse(saleSettingsRepository.save(settings));
    }

    public SaleSettingsResponse updateDealOfTheDay(UUID productId) {
        SaleSettings settings = getOrCreate();
        settings.setDealOfTheDayProductId(productId);
        return toResponse(saleSettingsRepository.save(settings));
    }

    private SaleSettingsResponse toResponse(SaleSettings settings) {
        SaleSettingsResponse.SaleSettingsResponseBuilder builder = SaleSettingsResponse.builder()
            .id(settings.getId())
            .saleTitle(settings.getSaleTitle())
            .saleSubtitle(settings.getSaleSubtitle())
            .maxDiscountText(settings.getMaxDiscountText())
            .saleEndDateTime(settings.getSaleEndDateTime())
            .isActive(settings.getIsActive())
            .dealOfTheDayProductId(settings.getDealOfTheDayProductId())
            .updatedAt(settings.getUpdatedAt());

        // Enrich with deal product details if set
        if (settings.getDealOfTheDayProductId() != null) {
            productRepository.findById(settings.getDealOfTheDayProductId()).ifPresent(p -> {
                String image = (p.getImages() != null && p.getImages().length > 0) ? p.getImages()[0] : null;
                builder
                    .dealProductName(p.getName())
                    .dealProductImage(image)
                    .dealProductPrice(p.getPrice())
                    .dealProductOriginalPrice(p.getOriginalPrice())
                    .dealProductDiscountPercentage(p.getDiscountPercentage())
                    .dealProductDescription(p.getShortDescription() != null ? p.getShortDescription() : p.getDescription());
            });
        }

        return builder.build();
    }
}
