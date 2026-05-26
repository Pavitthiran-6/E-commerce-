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
    Page<Product> findByDiscountPercentageGreaterThanAndIsActiveTrue(int discount, Pageable pageable);
    Page<Product> findByCategoryIdAndIsActiveTrue(Long categoryId, Pageable pageable);
    boolean existsByCategoryId(Long categoryId);
    long countByStockQuantityLessThan(int threshold);

    @Query("SELECT p FROM Product p WHERE p.isActive = true AND " +
           "(LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.brand) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.shortDescription) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<Product> searchProducts(String query, Pageable pageable);
}
