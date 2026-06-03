package com.belledonne.ecommerce.repository;

import com.belledonne.ecommerce.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductRepository extends JpaRepository<Product, UUID>, JpaSpecificationExecutor<Product> {
    Optional<Product> findBySlug(String slug);
    Page<Product> findByIsActiveTrue(Pageable pageable);
    Page<Product> findByIsFeaturedTrueAndIsActiveTrue(Pageable pageable);
    Page<Product> findByIsNewTrueAndIsActiveTrue(Pageable pageable);
    Page<Product> findByIsBestsellerTrueAndIsActiveTrue(Pageable pageable);
    Page<Product> findByIsApparelHighlightsTrueAndIsActiveTrue(Pageable pageable);
    Page<Product> findByIsTechHomeTrueAndIsActiveTrue(Pageable pageable);
    Page<Product> findByDiscountPercentageGreaterThanAndIsActiveTrue(int discount, Pageable pageable);
    Page<Product> findByIsOnSaleTrueAndIsActiveTrue(Pageable pageable);
    Page<Product> findByCategoryIdAndIsActiveTrue(Long categoryId, Pageable pageable);
    boolean existsByCategoryId(Long categoryId);
    long countByStockQuantityLessThan(int threshold);

    @Query(value = "SELECT p.* FROM products p " +
           "LEFT JOIN categories c ON p.category_id = c.id " +
           "LEFT JOIN categories parent_c ON c.parent_id = parent_c.id " +
           "WHERE p.is_active = true AND " +
           "(LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.brand) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(COALESCE(p.keywords, '')) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(COALESCE(ARRAY_TO_STRING(p.tags, ','), '')) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(COALESCE(p.description, '')) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(COALESCE(p.short_description, '')) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "(c.parent_id IS NULL AND LOWER(COALESCE(c.name, '')) LIKE LOWER(CONCAT('%', :query, '%'))) OR " +
           "(c.parent_id IS NOT NULL AND LOWER(COALESCE(parent_c.name, '')) LIKE LOWER(CONCAT('%', :query, '%'))) OR " +
           "(c.parent_id IS NOT NULL AND LOWER(COALESCE(c.name, '')) LIKE LOWER(CONCAT('%', :query, '%')))) " +
           "ORDER BY (CASE " +
           "  WHEN LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%')) THEN 7 " +
           "  WHEN LOWER(p.brand) LIKE LOWER(CONCAT('%', :query, '%')) THEN 6 " +
           "  WHEN LOWER(COALESCE(p.keywords, '')) LIKE LOWER(CONCAT('%', :query, '%')) THEN 5 " +
           "  WHEN LOWER(COALESCE(ARRAY_TO_STRING(p.tags, ','), '')) LIKE LOWER(CONCAT('%', :query, '%')) THEN 4 " +
           "  WHEN LOWER(COALESCE(p.description, '')) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(COALESCE(p.short_description, '')) LIKE LOWER(CONCAT('%', :query, '%')) THEN 3 " +
           "  WHEN (c.parent_id IS NULL AND LOWER(COALESCE(c.name, '')) LIKE LOWER(CONCAT('%', :query, '%'))) OR (c.parent_id IS NOT NULL AND LOWER(COALESCE(parent_c.name, '')) LIKE LOWER(CONCAT('%', :query, '%'))) THEN 2 " +
           "  WHEN c.parent_id IS NOT NULL AND LOWER(COALESCE(c.name, '')) LIKE LOWER(CONCAT('%', :query, '%')) THEN 1 " +
           "  ELSE 0 " +
           "END) DESC, p.name ASC",
           countQuery = "SELECT COUNT(*) FROM products p " +
           "LEFT JOIN categories c ON p.category_id = c.id " +
           "LEFT JOIN categories parent_c ON c.parent_id = parent_c.id " +
           "WHERE p.is_active = true AND " +
           "(LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.brand) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(COALESCE(p.keywords, '')) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(COALESCE(ARRAY_TO_STRING(p.tags, ','), '')) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(COALESCE(p.description, '')) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(COALESCE(p.short_description, '')) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "(c.parent_id IS NULL AND LOWER(COALESCE(c.name, '')) LIKE LOWER(CONCAT('%', :query, '%'))) OR " +
           "(c.parent_id IS NOT NULL AND LOWER(COALESCE(parent_c.name, '')) LIKE LOWER(CONCAT('%', :query, '%'))) OR " +
           "(c.parent_id IS NOT NULL AND LOWER(COALESCE(c.name, '')) LIKE LOWER(CONCAT('%', :query, '%'))))",
           nativeQuery = true)
    Page<Product> searchProducts(String query, Pageable pageable);
}
