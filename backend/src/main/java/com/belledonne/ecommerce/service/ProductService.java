package com.belledonne.ecommerce.service;

import com.belledonne.ecommerce.dto.request.ProductRequest;
import com.belledonne.ecommerce.dto.request.VariantRequest;
import com.belledonne.ecommerce.dto.response.ProductResponse;
import com.belledonne.ecommerce.entity.Category;
import com.belledonne.ecommerce.entity.Product;
import com.belledonne.ecommerce.entity.ProductVariant;
import com.belledonne.ecommerce.exception.BadRequestException;
import com.belledonne.ecommerce.exception.ResourceNotFoundException;
import com.belledonne.ecommerce.repository.CategoryRepository;
import com.belledonne.ecommerce.repository.ProductRepository;
import com.belledonne.ecommerce.repository.ProductVariantRepository;
import com.belledonne.ecommerce.util.SlugUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ProductVariantRepository productVariantRepository;

    public Page<Product> getAll(Pageable pageable) {
        return productRepository.findByIsActiveTrue(pageable);
    }

    public Page<ProductResponse> getAllResponses(Pageable pageable) {
        return productRepository.findByIsActiveTrue(pageable).map(this::toResponse);
    }

    public Page<Product> search(String query, Pageable pageable) {
        return productRepository.searchProducts(query, pageable);
    }

    public Page<ProductResponse> searchResponses(String query, Pageable pageable) {
        return productRepository.searchProducts(query, pageable).map(this::toResponse);
    }

    public Product getById(UUID id) {
        return productRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));
    }

    public ProductResponse getByIdResponse(UUID id) {
        return toResponse(getById(id));
    }

    public Product getBySlug(String slug) {
        return productRepository.findBySlug(slug)
            .orElseThrow(() -> new ResourceNotFoundException("Product", "slug", slug));
    }

    public ProductResponse getBySlugResponse(String slug) {
        return toResponse(getBySlug(slug));
    }

    public Page<Product> getFeatured(Pageable pageable) {
        return productRepository.findByIsFeaturedTrueAndIsActiveTrue(pageable);
    }

    public Page<ProductResponse> getFeaturedResponses(Pageable pageable) {
        return productRepository.findByIsFeaturedTrueAndIsActiveTrue(pageable).map(this::toResponse);
    }

    public Page<Product> getNewArrivals(Pageable pageable) {
        return productRepository.findByIsNewTrueAndIsActiveTrue(pageable);
    }

    public Page<ProductResponse> getNewArrivalsResponses(Pageable pageable) {
        return productRepository.findByIsNewTrueAndIsActiveTrue(pageable).map(this::toResponse);
    }

    public Page<Product> getBestsellers(Pageable pageable) {
        return productRepository.findByIsBestsellerTrueAndIsActiveTrue(pageable);
    }

    public Page<ProductResponse> getBestsellersResponses(Pageable pageable) {
        return productRepository.findByIsBestsellerTrueAndIsActiveTrue(pageable).map(this::toResponse);
    }

    public Page<Product> getApparelHighlights(Pageable pageable) {
        return productRepository.findByIsApparelHighlightsTrueAndIsActiveTrue(pageable);
    }

    public Page<ProductResponse> getApparelHighlightsResponses(Pageable pageable) {
        return productRepository.findByIsApparelHighlightsTrueAndIsActiveTrue(pageable).map(this::toResponse);
    }

    public Page<Product> getTechHome(Pageable pageable) {
        return productRepository.findByIsTechHomeTrueAndIsActiveTrue(pageable);
    }

    public Page<ProductResponse> getTechHomeResponses(Pageable pageable) {
        return productRepository.findByIsTechHomeTrueAndIsActiveTrue(pageable).map(this::toResponse);
    }

    public Page<Product> getSale(Pageable pageable) {
        return productRepository.findByIsOnSaleTrueAndIsActiveTrue(pageable);
    }

    public Page<ProductResponse> getSaleResponses(Pageable pageable) {
        return productRepository.findByIsOnSaleTrueAndIsActiveTrue(pageable).map(this::toResponse);
    }

    public ProductResponse updateProductDiscount(UUID id, Integer discountPercentage, Boolean isOnSale) {
        Product product = productRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));
        if (discountPercentage != null) {
            product.setDiscountPercentage(discountPercentage);
            // Auto-compute sale price from original price
            if (product.getOriginalPrice() != null && discountPercentage > 0) {
                java.math.BigDecimal discountFactor = java.math.BigDecimal.ONE
                    .subtract(java.math.BigDecimal.valueOf(discountPercentage).divide(java.math.BigDecimal.valueOf(100)));
                product.setPrice(product.getOriginalPrice().multiply(discountFactor)
                    .setScale(2, java.math.RoundingMode.HALF_UP));
            } else if (discountPercentage == 0 && product.getOriginalPrice() != null) {
                product.setPrice(product.getOriginalPrice());
            }
        }
        if (isOnSale != null) {
            product.setIsOnSale(isOnSale);
        }
        return toResponse(productRepository.save(product));
    }

    public ProductResponse toResponse(Product p) {
        List<ProductResponse.VariantResponse> variantResponses = p.getVariants().stream()
            .map(v -> ProductResponse.VariantResponse.builder()
                .id(v.getId())
                .size(v.getSize())
                .color(v.getColor())
                .colorHex(v.getColorHex())
                .stockQuantity(v.getStockQuantity())
                .additionalPrice(v.getAdditionalPrice())
                .build())
            .collect(Collectors.toList());

        List<ProductResponse.SpecificationDTO> specDTOs = (p.getSpecifications() != null)
            ? p.getSpecifications().stream()
                .map(s -> ProductResponse.SpecificationDTO.builder()
                    .key(s.getKey())
                    .value(s.getValue())
                    .displayOrder(s.getDisplayOrder())
                    .build())
                .collect(Collectors.toList())
            : List.of();

        return ProductResponse.builder()
            .id(p.getId())
            .name(p.getName())
            .slug(p.getSlug())
            .brand(p.getBrand())
            .categoryId(p.getCategory() != null ? p.getCategory().getId() : null)
            .categoryName(p.getCategory() != null ? p.getCategory().getName() : null)
            .description(p.getDescription())
            .shortDescription(p.getShortDescription())
            .price(p.getPrice())
            .originalPrice(p.getOriginalPrice())
            .discountPercentage(p.getDiscountPercentage())
            .stockQuantity(p.getStockQuantity())
            .isActive(p.getIsActive())
            .isFeatured(p.getIsFeatured())
            .isNew(p.getIsNew())
            .arrivalTag(p.getArrivalTag())
            .isBestseller(p.getIsBestseller())
            .isApparelHighlights(p.getIsApparelHighlights())
            .isTechHome(p.getIsTechHome())
            .isOnSale(p.getIsOnSale())
            .averageRating(p.getAverageRating())
            .reviewCount(p.getReviewCount())
            .tags(p.getTags())
            .images(p.getImages())
            .colors(p.getColors())
            .sizes(p.getSizes())
            .materialsTitle(p.getMaterialsTitle())
            .materialsContent(p.getMaterialsContent())
            .shippingTitle(p.getShippingTitle())
            .shippingContent(p.getShippingContent())
            .careTitle(p.getCareTitle())
            .careContent(p.getCareContent())
            .sustainabilityTitle(p.getSustainabilityTitle())
            .sustainabilityContent(p.getSustainabilityContent())
            .craftsmanshipTitle(p.getCraftsmanshipTitle())
            .craftsmanshipContent(p.getCraftsmanshipContent())
            .freeShipping(p.getFreeShipping())
            .codAvailable(p.getCodAvailable())
            .easyReturns(p.getEasyReturns())
            .variants(variantResponses)
            .specifications(specDTOs)
            .createdAt(p.getCreatedAt())
            .build();
    }

    public Product createProduct(ProductRequest request) {
        String slug = (request.getSlug() != null && !request.getSlug().isBlank())
            ? SlugUtil.toSlug(request.getSlug())
            : SlugUtil.toSlug(request.getName());

        if (productRepository.findBySlug(slug).isPresent()) {
            throw new BadRequestException("Product with slug '" + slug + "' already exists");
        }

        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", request.getCategoryId()));
        }

        Product product = Product.builder()
            .name(request.getName().trim())
            .slug(slug)
            .brand(request.getBrand())
            .category(category)
            .description(request.getDescription())
            .shortDescription(request.getShortDescription())
            .price(request.getPrice())
            .originalPrice(request.getOriginalPrice())
            .discountPercentage(request.getDiscountPercentage() != null ? request.getDiscountPercentage() : 0)
            .stockQuantity(request.getStockQuantity() != null ? request.getStockQuantity() : 0)
            .tags(request.getTags())
            .images(request.getImages() != null ? request.getImages() : new String[0])
            .colors(request.getColors())
            .sizes(request.getSizes())
            .materialsTitle(request.getMaterialsTitle() != null ? request.getMaterialsTitle() : "MATERIALS")
            .materialsContent(request.getMaterialsContent())
            .shippingTitle(request.getShippingTitle() != null ? request.getShippingTitle() : "SHIPPING & RETURNS")
            .shippingContent(request.getShippingContent())
            .careTitle(request.getCareTitle() != null ? request.getCareTitle() : "PRODUCT CARE")
            .careContent(request.getCareContent())
            .sustainabilityTitle(request.getSustainabilityTitle() != null ? request.getSustainabilityTitle() : "SUSTAINABILITY")
            .sustainabilityContent(request.getSustainabilityContent())
            .craftsmanshipTitle(request.getCraftsmanshipTitle() != null ? request.getCraftsmanshipTitle() : "CRAFTSMANSHIP")
            .craftsmanshipContent(request.getCraftsmanshipContent())
            .freeShipping(request.getFreeShipping() != null ? request.getFreeShipping() : true)
            .codAvailable(request.getCodAvailable() != null ? request.getCodAvailable() : true)
            .easyReturns(request.getEasyReturns() != null ? request.getEasyReturns() : true)
            .isApparelHighlights(request.getIsApparelHighlights() != null ? request.getIsApparelHighlights() : false)
            .isTechHome(request.getIsTechHome() != null ? request.getIsTechHome() : false)
            .isOnSale(request.getIsOnSale() != null ? request.getIsOnSale() : false)
            .isActive(true)
            .specifications(toSpecEntries(request.getSpecifications()))
            .build();

        return productRepository.save(product);
    }

    /** Creates a product and returns the response DTO — all within one transaction to avoid LazyInitializationException */
    public ProductResponse createProductResponse(ProductRequest request) {
        return toResponse(createProduct(request));
    }

    public Product updateProduct(UUID id, ProductRequest request) {
        Product product = productRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));

        String slug = (request.getSlug() != null && !request.getSlug().isBlank())
            ? SlugUtil.toSlug(request.getSlug())
            : SlugUtil.toSlug(request.getName());

        if (!product.getSlug().equals(slug) && productRepository.findBySlug(slug).isPresent()) {
            throw new BadRequestException("Product with slug '" + slug + "' already exists");
        }

        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", request.getCategoryId()));
        }

        product.setName(request.getName().trim());
        product.setSlug(slug);
        product.setBrand(request.getBrand());
        product.setCategory(category);
        product.setDescription(request.getDescription());
        product.setShortDescription(request.getShortDescription());
        product.setPrice(request.getPrice());
        product.setOriginalPrice(request.getOriginalPrice());
        product.setDiscountPercentage(request.getDiscountPercentage() != null ? request.getDiscountPercentage() : 0);
        product.setStockQuantity(request.getStockQuantity() != null ? request.getStockQuantity() : 0);
        product.setTags(request.getTags());
        product.setColors(request.getColors());
        product.setSizes(request.getSizes());
        if (request.getImages() != null) {
            product.setImages(request.getImages());
        }
        if (request.getIsNew() != null) {
            product.setIsNew(request.getIsNew());
        }
        if (request.getIsBestseller() != null) {
            product.setIsBestseller(request.getIsBestseller());
        }
        product.setMaterialsTitle(request.getMaterialsTitle());
        product.setMaterialsContent(request.getMaterialsContent());
        product.setShippingTitle(request.getShippingTitle());
        product.setShippingContent(request.getShippingContent());
        product.setCareTitle(request.getCareTitle());
        product.setCareContent(request.getCareContent());
        product.setSustainabilityTitle(request.getSustainabilityTitle());
        product.setSustainabilityContent(request.getSustainabilityContent());
        product.setCraftsmanshipTitle(request.getCraftsmanshipTitle());
        product.setCraftsmanshipContent(request.getCraftsmanshipContent());
        product.setFreeShipping(request.getFreeShipping() != null ? request.getFreeShipping() : true);
        product.setCodAvailable(request.getCodAvailable() != null ? request.getCodAvailable() : true);
        product.setEasyReturns(request.getEasyReturns() != null ? request.getEasyReturns() : true);
        product.setIsApparelHighlights(request.getIsApparelHighlights() != null ? request.getIsApparelHighlights() : false);
        product.setIsTechHome(request.getIsTechHome() != null ? request.getIsTechHome() : false);
        product.setIsOnSale(request.getIsOnSale() != null ? request.getIsOnSale() : false);
        if (request.getSpecifications() != null) {
            product.setSpecifications(toSpecEntries(request.getSpecifications()));
        }

        return productRepository.save(product);
    }

    /** Updates a product and returns the response DTO — all within one transaction to avoid LazyInitializationException */
    public ProductResponse updateProductResponse(UUID id, ProductRequest request) {
        return toResponse(updateProduct(id, request));
    }

    // ─── Helper: convert request DTOs → entity SpecificationEntry ────────────────
    private List<com.belledonne.ecommerce.entity.Product.SpecificationEntry> toSpecEntries(
            List<ProductRequest.SpecificationDTO> dtos) {
        if (dtos == null) return new java.util.ArrayList<>();
        return dtos.stream()
            .map(d -> new com.belledonne.ecommerce.entity.Product.SpecificationEntry(
                d.getKey(), d.getValue(), d.getDisplayOrder()))
            .collect(Collectors.toList());
    }

    public void deleteProduct(UUID id) {
        Product product = productRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));
        productRepository.delete(product);
    }

    public Product toggleActive(UUID id) {
        Product product = productRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));
        product.setIsActive(!product.getIsActive());
        return productRepository.save(product);
    }

    /** Toggles active and returns response DTO within one transaction */
    public ProductResponse toggleActiveResponse(UUID id) {
        return toResponse(toggleActive(id));
    }

    public Product toggleFeatured(UUID id) {
        Product product = productRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));
        product.setIsFeatured(!product.getIsFeatured());
        return productRepository.save(product);
    }

    /** Toggles featured and returns response DTO within one transaction */
    public ProductResponse toggleFeaturedResponse(UUID id) {
        return toResponse(toggleFeatured(id));
    }

    public Product saveProduct(Product product) {
        return productRepository.save(product);
    }

    /** Saves product and returns response DTO within one transaction */
    public ProductResponse saveProductResponse(Product product) {
        return toResponse(productRepository.save(product));
    }

    public ProductVariant addVariant(UUID productId, VariantRequest request) {
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));

        ProductVariant variant = ProductVariant.builder()
            .product(product)
            .size(request.getSize())
            .color(request.getColor())
            .colorHex(request.getColorHex())
            .stockQuantity(request.getStockQuantity() != null ? request.getStockQuantity() : 0)
            .additionalPrice(request.getAdditionalPrice() != null ? request.getAdditionalPrice() : BigDecimal.ZERO)
            .build();

        variant = productVariantRepository.save(variant);
        product.getVariants().add(variant);
        productRepository.save(product);
        return variant;
    }

    public ProductVariant updateVariant(UUID productId, Long variantId, VariantRequest request) {
        ProductVariant variant = productVariantRepository.findById(variantId)
            .orElseThrow(() -> new ResourceNotFoundException("ProductVariant", "id", variantId));

        if (!variant.getProduct().getId().equals(productId)) {
            throw new BadRequestException("Variant does not belong to specified product");
        }

        if (request.getSize() != null) variant.setSize(request.getSize());
        if (request.getColor() != null) variant.setColor(request.getColor());
        if (request.getColorHex() != null) variant.setColorHex(request.getColorHex());
        if (request.getStockQuantity() != null) variant.setStockQuantity(request.getStockQuantity());
        if (request.getAdditionalPrice() != null) variant.setAdditionalPrice(request.getAdditionalPrice());

        return productVariantRepository.save(variant);
    }

    public void deleteVariant(UUID productId, Long variantId) {
        ProductVariant variant = productVariantRepository.findById(variantId)
            .orElseThrow(() -> new ResourceNotFoundException("ProductVariant", "id", variantId));

        if (!variant.getProduct().getId().equals(productId)) {
            throw new BadRequestException("Variant does not belong to specified product");
        }

        Product product = variant.getProduct();
        product.getVariants().remove(variant);
        productVariantRepository.delete(variant);
        productRepository.save(product);
    }

    public Product updateArrivalTag(UUID id, String arrivalTag) {
        Product product = productRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));
        if (arrivalTag == null || arrivalTag.isBlank() || "Remove from New Arrivals".equalsIgnoreCase(arrivalTag)) {
            product.setArrivalTag(null);
            product.setIsNew(false);
        } else {
            product.setArrivalTag(arrivalTag);
            product.setIsNew(true);
        }
        return productRepository.save(product);
    }

    /** Updates arrival tag and returns response DTO within one transaction */
    public ProductResponse updateArrivalTagResponse(UUID id, String arrivalTag) {
        return toResponse(updateArrivalTag(id, arrivalTag));
    }
}
