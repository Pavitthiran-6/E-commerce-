package com.belledonne.ecommerce.service;

import com.belledonne.ecommerce.dto.request.HeroCardRequest;
import com.belledonne.ecommerce.dto.request.HeroRequest;
import com.belledonne.ecommerce.dto.response.HeroCardResponse;
import com.belledonne.ecommerce.dto.response.HeroResponse;
import com.belledonne.ecommerce.entity.HeroCard;
import com.belledonne.ecommerce.entity.HeroSection;
import com.belledonne.ecommerce.exception.ResourceNotFoundException;
import com.belledonne.ecommerce.repository.HeroCardRepository;
import com.belledonne.ecommerce.repository.HeroSectionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class HeroService {

    private final HeroSectionRepository heroSectionRepository;
    private final HeroCardRepository heroCardRepository;

    public HeroResponse getHeroSection() {
        HeroSection heroSection = heroSectionRepository.findAll().stream().findFirst()
            .orElseGet(this::createDefaultHeroSection);

        return toResponse(heroSection);
    }

    public HeroResponse updateHeroSection(HeroRequest request) {
        HeroSection heroSection = heroSectionRepository.findAll().stream().findFirst()
            .orElseGet(() -> HeroSection.builder().title("").build());

        heroSection.setTitle(request.getTitle().trim());
        heroSection.setBadge(request.getBadge());
        heroSection.setDateRange(request.getDateRange());
        heroSection.setBackgroundColor(request.getBackgroundColor());
        heroSection.setLeftIcon(request.getLeftIcon());
        heroSection.setRightIcon(request.getRightIcon());

        // Featured Card fields
        heroSection.setFeaturedProductName(request.getFeaturedProductName());
        heroSection.setFeaturedProductImage(request.getFeaturedProductImage());
        heroSection.setFeaturedOriginalPrice(request.getFeaturedOriginalPrice());
        heroSection.setFeaturedSalePrice(request.getFeaturedSalePrice());
        heroSection.setFeaturedDiscountPercentage(request.getFeaturedDiscountPercentage());
        heroSection.setFeaturedCardBackgroundColor(request.getFeaturedCardBackgroundColor());

        // Update Promo Cards
        heroSection.getPromoCards().clear();
        if (request.getPromoCards() != null) {
            for (HeroCardRequest cardReq : request.getPromoCards()) {
                HeroCard card = HeroCard.builder()
                    .title(cardReq.getTitle().trim())
                    .image(cardReq.getImage())
                    .discountPercentage(cardReq.getDiscountPercentage())
                    .backgroundColor(cardReq.getBackgroundColor())
                    .displayOrder(cardReq.getDisplayOrder() != null ? cardReq.getDisplayOrder() : 0)
                    .heroSection(heroSection)
                    .build();
                heroSection.getPromoCards().add(card);
            }
        }

        HeroSection saved = heroSectionRepository.save(heroSection);
        return toResponse(saved);
    }

    public void deleteHeroCard(Long cardId) {
        HeroCard card = heroCardRepository.findById(cardId)
            .orElseThrow(() -> new ResourceNotFoundException("HeroCard", "id", cardId));
        
        HeroSection parent = card.getHeroSection();
        if (parent != null) {
            parent.getPromoCards().remove(card);
            heroSectionRepository.save(parent);
        } else {
            heroCardRepository.delete(card);
        }
    }

    private HeroSection createDefaultHeroSection() {
        HeroSection hero = HeroSection.builder()
            .title("HOUSEFULL SALE")
            .badge("SALE")
            .dateRange("30TH MAY - 5TH JUNE")
            .backgroundColor("linear-gradient(to bottom right, #FFE082, #FFD54F, #FFCA28)")
            .featuredProductName("Summer Deals")
            .featuredProductImage("https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=400")
            .featuredOriginalPrice(new BigDecimal("1999.00"))
            .featuredSalePrice(new BigDecimal("999.00"))
            .featuredDiscountPercentage(50)
            .featuredCardBackgroundColor("#FFF9E6")
            .build();

        List<HeroCard> cards = new ArrayList<>();
        cards.add(HeroCard.builder().title("Footwear").image("https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=400").discountPercentage(25).backgroundColor("#FFF6F0").displayOrder(0).heroSection(hero).build());
        cards.add(HeroCard.builder().title("Men Wears").image("https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=400").discountPercentage(30).backgroundColor("#FFFBF0").displayOrder(1).heroSection(hero).build());
        cards.add(HeroCard.builder().title("Women Wears").image("https://images.unsplash.com/photo-1572804013309-8c98e16ea86d?q=80&w=400").discountPercentage(20).backgroundColor("#F5F7FF").displayOrder(2).heroSection(hero).build());
        cards.add(HeroCard.builder().title("Tech & Kitchen").image("https://images.unsplash.com/photo-1585237748805-728b75fba184?q=80&w=400").discountPercentage(23).backgroundColor("#EEFBF2").displayOrder(3).heroSection(hero).build());

        hero.setPromoCards(cards);
        return heroSectionRepository.save(hero);
    }

    private HeroResponse toResponse(HeroSection hero) {
        List<HeroCardResponse> cardResponses = hero.getPromoCards().stream()
            .map(c -> HeroCardResponse.builder()
                .id(c.getId())
                .title(c.getTitle())
                .image(c.getImage())
                .discountPercentage(c.getDiscountPercentage())
                .backgroundColor(c.getBackgroundColor())
                .displayOrder(c.getDisplayOrder())
                .build())
            .collect(Collectors.toList());

        return HeroResponse.builder()
            .id(hero.getId())
            .title(hero.getTitle())
            .badge(hero.getBadge())
            .dateRange(hero.getDateRange())
            .backgroundColor(hero.getBackgroundColor())
            .leftIcon(hero.getLeftIcon())
            .rightIcon(hero.getRightIcon())
            .featuredProductName(hero.getFeaturedProductName())
            .featuredProductImage(hero.getFeaturedProductImage())
            .featuredOriginalPrice(hero.getFeaturedOriginalPrice())
            .featuredSalePrice(hero.getFeaturedSalePrice())
            .featuredDiscountPercentage(hero.getFeaturedDiscountPercentage())
            .featuredCardBackgroundColor(hero.getFeaturedCardBackgroundColor())
            .promoCards(cardResponses)
            .build();
    }
}
