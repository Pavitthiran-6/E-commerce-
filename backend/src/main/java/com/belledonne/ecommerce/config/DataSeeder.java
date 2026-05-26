package com.belledonne.ecommerce.config;

import com.belledonne.ecommerce.entity.Category;
import com.belledonne.ecommerce.entity.Product;
import com.belledonne.ecommerce.repository.CategoryRepository;
import com.belledonne.ecommerce.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

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
                    .build()
            );

            productRepository.saveAll(products);
        }
    }
}
