package com.belledonne.ecommerce.repository;

import com.belledonne.ecommerce.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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
    java.util.List<Product> findByNameContainingIgnoreCase(String name);

    @Query(value = "SELECT p.* FROM products p " +
           "LEFT JOIN categories c ON p.category_id = c.id " +
           "LEFT JOIN categories parent_c ON c.parent_id = parent_c.id " +
           "WHERE p.is_active = true AND (" +
           "  EXISTS (SELECT 1 FROM unnest(string_to_array(:terms, '|')) t WHERE LOWER(p.name) LIKE LOWER(CONCAT('%', t, '%'))) OR " +
           "  EXISTS (SELECT 1 FROM unnest(string_to_array(:terms, '|')) t WHERE LOWER(p.brand) LIKE LOWER(CONCAT('%', t, '%'))) OR " +
           "  EXISTS (SELECT 1 FROM unnest(string_to_array(:terms, '|')) t WHERE LOWER(COALESCE(p.keywords, '')) LIKE LOWER(CONCAT('%', t, '%'))) OR " +
           "  EXISTS (SELECT 1 FROM unnest(string_to_array(:terms, '|')) t WHERE LOWER(COALESCE(ARRAY_TO_STRING(p.tags, ','), '')) LIKE LOWER(CONCAT('%', t, '%'))) OR " +
           "  EXISTS (SELECT 1 FROM unnest(string_to_array(:terms, '|')) t WHERE LOWER(COALESCE(p.description, '')) LIKE LOWER(CONCAT('%', t, '%'))) OR " +
           "  EXISTS (SELECT 1 FROM unnest(string_to_array(:terms, '|')) t WHERE LOWER(COALESCE(p.short_description, '')) LIKE LOWER(CONCAT('%', t, '%'))) OR " +
           "  EXISTS (SELECT 1 FROM unnest(string_to_array(:terms, '|')) t WHERE (c.parent_id IS NULL AND LOWER(COALESCE(c.name, '')) LIKE LOWER(CONCAT('%', t, '%'))) OR (c.parent_id IS NOT NULL AND LOWER(COALESCE(parent_c.name, '')) LIKE LOWER(CONCAT('%', t, '%')))) OR " +
           "  EXISTS (SELECT 1 FROM unnest(string_to_array(:terms, '|')) t WHERE c.parent_id IS NOT NULL AND LOWER(COALESCE(c.name, '')) LIKE LOWER(CONCAT('%', t, '%')))" +
           ") " +
           "ORDER BY (" +
           "  SELECT COALESCE(MAX(score), 0) FROM (" +
           "    SELECT " +
           "      CASE " +
           "        WHEN LOWER(p.name) LIKE LOWER(CONCAT('%', t, '%')) THEN 7 " +
           "        WHEN LOWER(p.brand) LIKE LOWER(CONCAT('%', t, '%')) THEN 6 " +
           "        WHEN LOWER(COALESCE(p.keywords, '')) LIKE LOWER(CONCAT('%', t, '%')) THEN 5 " +
           "        WHEN LOWER(COALESCE(ARRAY_TO_STRING(p.tags, ','), '')) LIKE LOWER(CONCAT('%', t, '%')) THEN 4 " +
           "        WHEN LOWER(COALESCE(p.description, '')) LIKE LOWER(CONCAT('%', t, '%')) OR LOWER(COALESCE(p.short_description, '')) LIKE LOWER(CONCAT('%', t, '%')) THEN 3 " +
           "        WHEN (c.parent_id IS NULL AND LOWER(COALESCE(c.name, '')) LIKE LOWER(CONCAT('%', t, '%'))) OR (c.parent_id IS NOT NULL AND LOWER(COALESCE(parent_c.name, '')) LIKE LOWER(CONCAT('%', t, '%'))) THEN 2 " +
           "        WHEN c.parent_id IS NOT NULL AND LOWER(COALESCE(c.name, '')) LIKE LOWER(CONCAT('%', t, '%')) THEN 1 " +
           "        ELSE 0 " +
           "      END AS score " +
           "    FROM unnest(string_to_array(:terms, '|')) t" +
           "  ) scores" +
           ") DESC, p.name ASC",
           countQuery = "SELECT COUNT(*) FROM products p " +
           "LEFT JOIN categories c ON p.category_id = c.id " +
           "LEFT JOIN categories parent_c ON c.parent_id = parent_c.id " +
           "WHERE p.is_active = true AND (" +
           "  EXISTS (SELECT 1 FROM unnest(string_to_array(:terms, '|')) t WHERE LOWER(p.name) LIKE LOWER(CONCAT('%', t, '%'))) OR " +
           "  EXISTS (SELECT 1 FROM unnest(string_to_array(:terms, '|')) t WHERE LOWER(p.brand) LIKE LOWER(CONCAT('%', t, '%'))) OR " +
           "  EXISTS (SELECT 1 FROM unnest(string_to_array(:terms, '|')) t WHERE LOWER(COALESCE(p.keywords, '')) LIKE LOWER(CONCAT('%', t, '%'))) OR " +
           "  EXISTS (SELECT 1 FROM unnest(string_to_array(:terms, '|')) t WHERE LOWER(COALESCE(ARRAY_TO_STRING(p.tags, ','), '')) LIKE LOWER(CONCAT('%', t, '%'))) OR " +
           "  EXISTS (SELECT 1 FROM unnest(string_to_array(:terms, '|')) t WHERE LOWER(COALESCE(p.description, '')) LIKE LOWER(CONCAT('%', t, '%'))) OR " +
           "  EXISTS (SELECT 1 FROM unnest(string_to_array(:terms, '|')) t WHERE LOWER(COALESCE(p.short_description, '')) LIKE LOWER(CONCAT('%', t, '%'))) OR " +
           "  EXISTS (SELECT 1 FROM unnest(string_to_array(:terms, '|')) t WHERE (c.parent_id IS NULL AND LOWER(COALESCE(c.name, '')) LIKE LOWER(CONCAT('%', t, '%'))) OR (c.parent_id IS NOT NULL AND LOWER(COALESCE(parent_c.name, '')) LIKE LOWER(CONCAT('%', t, '%')))) OR " +
           "  EXISTS (SELECT 1 FROM unnest(string_to_array(:terms, '|')) t WHERE c.parent_id IS NOT NULL AND LOWER(COALESCE(c.name, '')) LIKE LOWER(CONCAT('%', t, '%')))" +
           ")",
           nativeQuery = true)
    Page<Product> searchProducts(@Param("terms") String terms, Pageable pageable);
}
