package com.belledonne.ecommerce.config;

import com.belledonne.ecommerce.entity.Category;
import com.belledonne.ecommerce.entity.Product;
import com.belledonne.ecommerce.entity.Coupon;
import com.belledonne.ecommerce.entity.SaleSettings;
import com.belledonne.ecommerce.repository.CategoryRepository;
import com.belledonne.ecommerce.repository.CouponRepository;
import com.belledonne.ecommerce.repository.ProductRepository;
import com.belledonne.ecommerce.repository.SaleSettingsRepository;
import com.belledonne.ecommerce.repository.HeroSectionRepository;
import com.belledonne.ecommerce.entity.HeroSection;
import com.belledonne.ecommerce.entity.HeroCard;
import lombok.RequiredArgsConstructor;
import java.util.ArrayList;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final CouponRepository couponRepository;
    private final SaleSettingsRepository saleSettingsRepository;
    private final HeroSectionRepository heroSectionRepository;

    @Override
    public void run(String... args) throws Exception {
        if (categoryRepository.count() == 0) {
            Category footwear = Category.builder().name("Footwear").slug("footwear").isActive(true).build();
            Category men = Category.builder().name("Men").slug("men").isActive(true).build();
            Category women = Category.builder().name("Women").slug("women").isActive(true).build();
            Category techKitchen = Category.builder().name("Tech & Kitchen").slug("tech-kitchen").isActive(true).build();

            categoryRepository.saveAll(Arrays.asList(footwear, men, women, techKitchen));
        }

        if (productRepository.count() == 0) {
            Category footwear = categoryRepository.findBySlug("footwear").orElse(null);
            Category men = categoryRepository.findBySlug("men").orElse(null);
            Category women = categoryRepository.findBySlug("women").orElse(null);
            Category techKitchen = categoryRepository.findBySlug("tech-kitchen").orElse(null);

            List<Product> products = Arrays.asList(
                // FOOTWEAR
                Product.builder()
                    .name("Bo Velcro Sneaker")
                    .brand("BELLEDONNE")
                    .category(footwear)
                    .slug("bo-velcro")
                    .price(new BigDecimal("16500.00"))
                    .originalPrice(new BigDecimal("22000.00"))
                    .discountPercentage(25)
                    .images(new String[]{"https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=500"})
                    .tags(new String[]{"shoes", "sneakers", "footwear", "casual", "leather"})
                    .description("Classic minimalist sneaker featuring dual velcro straps for effortless style.")
                    .shortDescription("Dual velcro strap minimalist sneaker.")
                    .averageRating(new BigDecimal("4.80"))
                    .reviewCount(124)
                    .stockQuantity(50)
                    .isActive(true)
                    .isNew(true)
                    .isFeatured(true)
                    .isBestseller(true)
                    .build(),
                Product.builder()
                    .name("Classic Chelsea Boot")
                    .brand("BELLEDONNE")
                    .category(footwear)
                    .slug("chelsea-boot")
                    .price(new BigDecimal("18000.00"))
                    .originalPrice(new BigDecimal("18000.00"))
                    .discountPercentage(0)
                    .images(new String[]{"https://images.unsplash.com/photo-1608256246200-53e635b5b65f?q=80&w=500"})
                    .tags(new String[]{"shoes", "boots", "footwear", "suede"})
                    .description("Premium suede Chelsea boots, perfect for semi-formal and casual wear.")
                    .shortDescription("Premium suede Chelsea boots.")
                    .averageRating(new BigDecimal("4.60"))
                    .reviewCount(89)
                    .stockQuantity(40)
                    .isActive(true)
                    .isNew(false)
                    .isFeatured(false)
                    .isBestseller(false)
                    .build(),
                Product.builder()
                    .name("Ankle Strap Stilettos")
                    .brand("BELLEDONNE")
                    .category(footwear)
                    .slug("strap-heels")
                    .price(new BigDecimal("12500.00"))
                    .originalPrice(new BigDecimal("15000.00"))
                    .discountPercentage(16)
                    .images(new String[]{"https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=500"})
                    .tags(new String[]{"shoes", "heels", "footwear", "party"})
                    .description("Elegant stiletto heels featuring a delicate ankle strap.")
                    .shortDescription("Elegant stiletto heels.")
                    .averageRating(new BigDecimal("4.70"))
                    .reviewCount(215)
                    .stockQuantity(30)
                    .isActive(true)
                    .isNew(false)
                    .isFeatured(false)
                    .isBestseller(true)
                    .build(),

                // MEN'S CLOTHING
                Product.builder()
                    .name("Breezy Linen Shirt")
                    .brand("BELLEDONNE")
                    .category(men)
                    .slug("linen-shirt")
                    .price(new BigDecimal("3500.00"))
                    .originalPrice(new BigDecimal("5000.00"))
                    .discountPercentage(30)
                    .images(new String[]{"https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=500"})
                    .tags(new String[]{"clothing", "men", "shirt", "linen", "summer"})
                    .description("100% pure linen shirt for maximum breathability during summer.")
                    .shortDescription("100% pure linen shirt.")
                    .averageRating(new BigDecimal("4.50"))
                    .reviewCount(65)
                    .stockQuantity(100)
                    .isActive(true)
                    .isNew(true)
                    .isFeatured(false)
                    .isBestseller(false)
                    .isApparelHighlights(true)
                    .build(),
                Product.builder()
                    .name("Tailored Chino Trousers")
                    .brand("BELLEDONNE")
                    .category(men)
                    .slug("chino-trousers")
                    .price(new BigDecimal("4200.00"))
                    .originalPrice(new BigDecimal("4200.00"))
                    .discountPercentage(0)
                    .images(new String[]{"https://images.unsplash.com/photo-1473966968600-fa801b869a1a?q=80&w=500"})
                    .tags(new String[]{"clothing", "men", "trousers", "pants", "formal"})
                    .description("Comfortable stretch chinos tailored for a perfect fit.")
                    .shortDescription("Comfortable stretch chinos.")
                    .averageRating(new BigDecimal("4.80"))
                    .reviewCount(310)
                    .stockQuantity(80)
                    .isActive(true)
                    .isNew(false)
                    .isFeatured(false)
                    .isBestseller(true)
                    .build(),
                Product.builder()
                    .name("Essential Crewneck T-Shirt")
                    .brand("BELLEDONNE")
                    .category(men)
                    .slug("crewneck-tee")
                    .price(new BigDecimal("1200.00"))
                    .originalPrice(new BigDecimal("1500.00"))
                    .discountPercentage(20)
                    .images(new String[]{"https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=500"})
                    .tags(new String[]{"clothing", "men", "t-shirt", "casual", "essentials"})
                    .description("Premium Pima cotton t-shirt built for everyday comfort.")
                    .shortDescription("Premium Pima cotton t-shirt.")
                    .averageRating(new BigDecimal("4.90"))
                    .reviewCount(840)
                    .stockQuantity(200)
                    .isActive(true)
                    .isNew(false)
                    .isFeatured(false)
                    .isBestseller(true)
                    .build(),

                // WOMEN'S CLOTHING
                Product.builder()
                    .name("Elegant Silk Blouse")
                    .brand("BELLEDONNE")
                    .category(women)
                    .slug("silk-blouse")
                    .price(new BigDecimal("5500.00"))
                    .originalPrice(new BigDecimal("5500.00"))
                    .discountPercentage(0)
                    .images(new String[]{"https://images.unsplash.com/photo-1588117305388-c2631a279f82?q=80&w=500"})
                    .tags(new String[]{"clothing", "women", "blouse", "silk", "formal"})
                    .description("Luxurious silk blouse with subtle drape detailing.")
                    .shortDescription("Luxurious silk blouse.")
                    .averageRating(new BigDecimal("4.70"))
                    .reviewCount(92)
                    .stockQuantity(45)
                    .isActive(true)
                    .isNew(true)
                    .isFeatured(false)
                    .isBestseller(false)
                    .isApparelHighlights(true)
                    .build(),
                Product.builder()
                    .name("Floral Midi Dress")
                    .brand("BELLEDONNE")
                    .category(women)
                    .slug("summer-dress")
                    .price(new BigDecimal("4800.00"))
                    .originalPrice(new BigDecimal("6000.00"))
                    .discountPercentage(20)
                    .images(new String[]{"https://images.unsplash.com/photo-1572804013309-8c98e16ea86d?q=80&w=500"})
                    .tags(new String[]{"clothing", "women", "dress", "floral", "summer"})
                    .description("Lightweight midi dress featuring a vibrant floral print.")
                    .shortDescription("Lightweight midi dress.")
                    .averageRating(new BigDecimal("4.80"))
                    .reviewCount(145)
                    .stockQuantity(60)
                    .isActive(true)
                    .isNew(true)
                    .isFeatured(true)
                    .isBestseller(true)
                    .isApparelHighlights(true)
                    .build(),
                Product.builder()
                    .name("High-Waist Mom Jeans")
                    .brand("BELLEDONNE")
                    .category(women)
                    .slug("high-waist-jeans")
                    .price(new BigDecimal("3200.00"))
                    .originalPrice(new BigDecimal("4000.00"))
                    .discountPercentage(20)
                    .images(new String[]{"https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=500"})
                    .tags(new String[]{"clothing", "women", "jeans", "denim", "casual"})
                    .description("Classic high-waisted mom jeans in rigid denim.")
                    .shortDescription("Classic high-waisted mom jeans.")
                    .averageRating(new BigDecimal("4.60"))
                    .reviewCount(420)
                    .stockQuantity(70)
                    .isActive(true)
                    .isNew(false)
                    .isFeatured(false)
                    .isBestseller(true)
                    .build(),

                // TECH & KITCHEN
                Product.builder()
                    .name("Pro Smart Blender")
                    .brand("BELLEDONNE Tech")
                    .category(techKitchen)
                    .slug("smart-blender")
                    .price(new BigDecimal("18500.00"))
                    .originalPrice(new BigDecimal("24000.00"))
                    .discountPercentage(23)
                    .images(new String[]{"https://images.unsplash.com/photo-1585237748805-728b75fba184?q=80&w=500"})
                    .tags(new String[]{"kitchen", "appliances", "blender", "smart"})
                    .description("High-speed professional blender with app connectivity and automated programs.")
                    .shortDescription("High-speed professional blender.")
                    .averageRating(new BigDecimal("4.90"))
                    .reviewCount(56)
                    .stockQuantity(25)
                    .isActive(true)
                    .isNew(true)
                    .isFeatured(false)
                    .isBestseller(false)
                    .isTechHome(true)
                    .build(),
                Product.builder()
                    .name("Aura ANC Headphones")
                    .brand("BELLEDONNE Tech")
                    .category(techKitchen)
                    .slug("noise-cancelling-headphones")
                    .price(new BigDecimal("24999.00"))
                    .originalPrice(new BigDecimal("29999.00"))
                    .discountPercentage(16)
                    .images(new String[]{"https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?q=80&w=500"})
                    .tags(new String[]{"tech", "audio", "headphones", "wireless"})
                    .description("Over-ear wireless headphones with industry-leading active noise cancellation.")
                    .shortDescription("Over-ear wireless headphones.")
                    .averageRating(new BigDecimal("4.80"))
                    .reviewCount(389)
                    .stockQuantity(35)
                    .isActive(true)
                    .isNew(false)
                    .isFeatured(true)
                    .isBestseller(true)
                    .isTechHome(true)
                    .build(),
                Product.builder()
                    .name("Infinity Smart Watch")
                    .brand("BELLEDONNE Tech")
                    .category(techKitchen)
                    .slug("smart-watch-pro")
                    .price(new BigDecimal("14500.00"))
                    .originalPrice(new BigDecimal("14500.00"))
                    .discountPercentage(0)
                    .images(new String[]{"https://images.unsplash.com/photo-1546868871-7041f2a55e12?q=80&w=500"})
                    .tags(new String[]{"tech", "wearables", "watch", "fitness"})
                    .description("Advanced smartwatch with ECG, fitness tracking, and cellular connectivity.")
                    .shortDescription("Advanced smartwatch.")
                    .averageRating(new BigDecimal("4.70"))
                    .reviewCount(178)
                    .stockQuantity(65)
                    .isActive(true)
                    .isNew(true)
                    .isFeatured(true)
                    .isBestseller(true)
                    .isTechHome(true)
                    .build()
            );

            productRepository.saveAll(products);
        }

        if (couponRepository.count() == 0) {
            Coupon c1 = Coupon.builder()
                .code("WELCOME10")
                .description("Get 10% off on your first order")
                .type("PERCENTAGE")
                .value(new BigDecimal("10.00"))
                .minCartValue(new BigDecimal("1000.00"))
                .maxDiscount(new BigDecimal("500.00"))
                .validFrom(LocalDateTime.now().minusDays(1))
                .validUntil(LocalDateTime.now().plusMonths(6))
                .isActive(true)
                .build();

            Coupon c2 = Coupon.builder()
                .code("FESTIVE500")
                .description("Flat ₹500 off on shopping above ₹3000")
                .type("FLAT")
                .value(new BigDecimal("500.00"))
                .minCartValue(new BigDecimal("3000.00"))
                .validFrom(LocalDateTime.now().minusDays(1))
                .validUntil(LocalDateTime.now().plusMonths(1))
                .isActive(true)
                .build();

            Coupon c3 = Coupon.builder()
                .code("LUXURY25")
                .description("25% off on luxury items")
                .type("PERCENTAGE")
                .value(new BigDecimal("25.00"))
                .minCartValue(new BigDecimal("5000.00"))
                .maxDiscount(new BigDecimal("2500.00"))
                .validFrom(LocalDateTime.now().minusDays(1))
                .validUntil(LocalDateTime.now().plusMonths(3))
                .isActive(true)
                .build();

            couponRepository.saveAll(Arrays.asList(c1, c2, c3));
        }

        // Seed default SaleSettings
        if (saleSettingsRepository.count() == 0) {
            SaleSettings defaultSettings = SaleSettings.builder()
                .saleTitle("SALE IS LIVE 🔥")
                .saleSubtitle("Limited time deals — up to 70% off on selected products!")
                .maxDiscountText("up to 70% off")
                .saleEndDateTime(LocalDateTime.now().plusDays(7))
                .isActive(true)
                .build();
            saleSettingsRepository.save(defaultSettings);
        }

        // Ensure all template categories exist
        Category footwearCat = categoryRepository.findBySlug("footwear")
            .orElseGet(() -> categoryRepository.save(Category.builder().name("Footwear").slug("footwear").isActive(true).build()));
        
        Category toysCat = categoryRepository.findBySlug("kids-toys")
            .orElseGet(() -> categoryRepository.save(Category.builder().name("Kids Toys").slug("kids-toys").isActive(true).build()));
            
        Category techKitchenCat = categoryRepository.findBySlug("tech-kitchen")
            .orElseGet(() -> categoryRepository.save(Category.builder().name("Tech & Kitchen").slug("tech-kitchen").isActive(true).build()));
            
        Category appliancesCat = categoryRepository.findBySlug("home-appliances")
            .orElseGet(() -> categoryRepository.save(Category.builder().name("Home Appliances").slug("home-appliances").isActive(true).build()));

        // 1. Fashion & Clothing Product: Bo Velcro Sneaker (slug: bo-velcro)
        Product boVelcro = productRepository.findBySlug("bo-velcro").orElse(null);
        if (boVelcro != null) {
            boVelcro.setSpecifications(Arrays.asList(
                new Product.SpecificationEntry("Color", "Walnut", 1),
                new Product.SpecificationEntry("Material", "Full-Grain Leather", 2),
                new Product.SpecificationEntry("Fit", "Regular Fit (True to size)", 3),
                new Product.SpecificationEntry("Care Instructions", "Wipe with damp cloth", 4)
            ));
            productRepository.save(boVelcro);
        } else {
            productRepository.save(Product.builder()
                .name("Bo Velcro Sneaker")
                .brand("BELLEDONNE")
                .category(footwearCat)
                .slug("bo-velcro")
                .price(new BigDecimal("16500.00"))
                .originalPrice(new BigDecimal("22000.00"))
                .discountPercentage(25)
                .images(new String[]{"https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=500"})
                .tags(new String[]{"shoes", "sneakers", "footwear", "casual", "leather"})
                .description("Classic minimalist sneaker featuring dual velcro straps for effortless style.")
                .shortDescription("Dual velcro strap minimalist sneaker.")
                .averageRating(new BigDecimal("4.80"))
                .reviewCount(124)
                .stockQuantity(50)
                .isActive(true)
                .isNew(true)
                .isFeatured(true)
                .isBestseller(true)
                .specifications(Arrays.asList(
                    new Product.SpecificationEntry("Color", "Walnut", 1),
                    new Product.SpecificationEntry("Material", "Full-Grain Leather", 2),
                    new Product.SpecificationEntry("Fit", "Regular Fit (True to size)", 3),
                    new Product.SpecificationEntry("Care Instructions", "Wipe with damp cloth", 4)
                ))
                .build());
        }

        // 2. Kids Toys Product: Wooden Activity Blocks (slug: wooden-building-blocks)
        Product toyProduct = productRepository.findBySlug("wooden-building-blocks").orElse(null);
        if (toyProduct != null) {
            toyProduct.setSpecifications(Arrays.asList(
                new Product.SpecificationEntry("Age Range", "3-8 Years", 1),
                new Product.SpecificationEntry("Material", "Natural Sustainably Sourced Wood", 2),
                new Product.SpecificationEntry("Battery Required", "No", 3),
                new Product.SpecificationEntry("Safety Certification", "BIS Certified", 4),
                new Product.SpecificationEntry("Total Pieces", "50 Pieces", 5)
            ));
            productRepository.save(toyProduct);
        } else {
            productRepository.save(Product.builder()
                .name("Wooden Activity Building Blocks Set")
                .brand("BELLEDONNE Play")
                .category(toysCat)
                .slug("wooden-building-blocks")
                .price(new BigDecimal("2499.00"))
                .originalPrice(new BigDecimal("3499.00"))
                .discountPercentage(28)
                .images(new String[]{"https://images.unsplash.com/photo-1515488042361-404e9250afef?q=80&w=500"})
                .tags(new String[]{"toys", "wooden", "kids", "blocks", "educational"})
                .description("Classic wooden building blocks designed for creative and motor skill development.")
                .shortDescription("50-piece wooden building blocks set.")
                .averageRating(new BigDecimal("4.90"))
                .reviewCount(42)
                .stockQuantity(15)
                .isActive(true)
                .isNew(true)
                .specifications(Arrays.asList(
                    new Product.SpecificationEntry("Age Range", "3-8 Years", 1),
                    new Product.SpecificationEntry("Material", "Natural Sustainably Sourced Wood", 2),
                    new Product.SpecificationEntry("Battery Required", "No", 3),
                    new Product.SpecificationEntry("Safety Certification", "BIS Certified", 4),
                    new Product.SpecificationEntry("Total Pieces", "50 Pieces", 5)
                ))
                .build());
        }

        // 3. Kitchen & Cookware Product: Pro Smart Blender (slug: smart-blender)
        Product blender = productRepository.findBySlug("smart-blender").orElse(null);
        if (blender != null) {
            blender.setSpecifications(Arrays.asList(
                new Product.SpecificationEntry("Capacity", "2 Litres", 1),
                new Product.SpecificationEntry("Material", "Tritan (BPA-Free) & Stainless Steel", 2),
                new Product.SpecificationEntry("Dishwasher Safe", "Yes (Pitcher only)", 3),
                new Product.SpecificationEntry("Power", "1000W", 4),
                new Product.SpecificationEntry("Speed Settings", "10 Speeds + Pulse", 5)
            ));
            productRepository.save(blender);
        } else {
            productRepository.save(Product.builder()
                .name("Pro Smart Blender")
                .brand("BELLEDONNE Tech")
                .category(techKitchenCat)
                .slug("smart-blender")
                .price(new BigDecimal("18500.00"))
                .originalPrice(new BigDecimal("24000.00"))
                .discountPercentage(23)
                .images(new String[]{"https://images.unsplash.com/photo-1585237748805-728b75fba184?q=80&w=500"})
                .tags(new String[]{"kitchen", "appliances", "blender", "smart"})
                .description("High-speed professional blender with app connectivity and automated programs.")
                .shortDescription("High-speed professional blender.")
                .averageRating(new BigDecimal("4.90"))
                .reviewCount(56)
                .stockQuantity(25)
                .isActive(true)
                .isNew(true)
                .isTechHome(true)
                .specifications(Arrays.asList(
                    new Product.SpecificationEntry("Capacity", "2 Litres", 1),
                    new Product.SpecificationEntry("Material", "Tritan (BPA-Free) & Stainless Steel", 2),
                    new Product.SpecificationEntry("Dishwasher Safe", "Yes (Pitcher only)", 3),
                    new Product.SpecificationEntry("Power", "1000W", 4),
                    new Product.SpecificationEntry("Speed Settings", "10 Speeds + Pulse", 5)
                ))
                .build());
        }

        // 4. Home Appliances Product: Aura Robotic Vacuum (slug: robotic-vacuum)
        Product vacuum = productRepository.findBySlug("robotic-vacuum").orElse(null);
        if (vacuum != null) {
            vacuum.setSpecifications(Arrays.asList(
                new Product.SpecificationEntry("Power Consumption", "1500W", 1),
                new Product.SpecificationEntry("Noise Level", "60 dB", 2),
                new Product.SpecificationEntry("Dustbin Capacity", "0.6 Litres", 3),
                new Product.SpecificationEntry("Warranty", "2 Years", 4),
                new Product.SpecificationEntry("Battery Run Time", "120 Minutes", 5)
            ));
            productRepository.save(vacuum);
        } else {
            productRepository.save(Product.builder()
                .name("Aura Robotic Vacuum Cleaner")
                .brand("BELLEDONNE Tech")
                .category(appliancesCat)
                .slug("robotic-vacuum")
                .price(new BigDecimal("29999.00"))
                .originalPrice(new BigDecimal("34999.00"))
                .discountPercentage(14)
                .images(new String[]{"https://images.unsplash.com/photo-1589656966895-2f33e7653819?q=80&w=500"})
                .tags(new String[]{"appliances", "vacuum", "robotic", "smart"})
                .description("Smart self-charging robotic vacuum cleaner with advanced mapping technology.")
                .shortDescription("Smart robotic vacuum cleaner.")
                .averageRating(new BigDecimal("4.80"))
                .reviewCount(28)
                .stockQuantity(12)
                .isActive(true)
                .isFeatured(true)
                .specifications(Arrays.asList(
                    new Product.SpecificationEntry("Power Consumption", "1500W", 1),
                    new Product.SpecificationEntry("Noise Level", "60 dB", 2),
                    new Product.SpecificationEntry("Dustbin Capacity", "0.6 Litres", 3),
                    new Product.SpecificationEntry("Warranty", "2 Years", 4),
                    new Product.SpecificationEntry("Battery Run Time", "120 Minutes", 5)
                ))
                .build());
        }

        // 5. Electronics Product: Infinity Smart Watch Pro (slug: smart-watch-pro)
        Product watch = productRepository.findBySlug("smart-watch-pro").orElse(null);
        if (watch != null) {
            watch.setSpecifications(Arrays.asList(
                new Product.SpecificationEntry("Screen Size", "1.9 Inches OLED", 1),
                new Product.SpecificationEntry("Battery Capacity", "300 mAh", 2),
                new Product.SpecificationEntry("Connectivity", "Bluetooth 5.2, Wi-Fi, LTE", 3),
                new Product.SpecificationEntry("Water Resistance", "IP68 (Up to 50m)", 4),
                new Product.SpecificationEntry("Health Sensors", "Heart Rate, ECG, SpO2", 5)
            ));
            productRepository.save(watch);
        } else {
            productRepository.save(Product.builder()
                .name("Infinity Smart Watch Pro")
                .brand("BELLEDONNE Tech")
                .category(techKitchenCat)
                .slug("smart-watch-pro")
                .price(new BigDecimal("14500.00"))
                .originalPrice(new BigDecimal("14500.00"))
                .discountPercentage(0)
                .images(new String[]{"https://images.unsplash.com/photo-1546868871-7041f2a55e12?q=80&w=500"})
                .tags(new String[]{"tech", "wearables", "watch", "fitness"})
                .description("Advanced smartwatch with ECG, fitness tracking, and cellular connectivity.")
                .shortDescription("Advanced smartwatch.")
                .averageRating(new BigDecimal("4.70"))
                .reviewCount(178)
                .stockQuantity(65)
                .isActive(true)
                .isNew(true)
                .isFeatured(true)
                .isTechHome(true)
                .specifications(Arrays.asList(
                    new Product.SpecificationEntry("Screen Size", "1.9 Inches OLED", 1),
                    new Product.SpecificationEntry("Battery Capacity", "300 mAh", 2),
                    new Product.SpecificationEntry("Connectivity", "Bluetooth 5.2, Wi-Fi, LTE", 3),
                    new Product.SpecificationEntry("Water Resistance", "IP68 (Up to 50m)", 4),
                    new Product.SpecificationEntry("Health Sensors", "Heart Rate, ECG, SpO2", 5)
                ))
                .build());
        }

        // Seed default HeroSection
        if (heroSectionRepository.count() == 0) {
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
            heroSectionRepository.save(hero);
        }
    }
}
