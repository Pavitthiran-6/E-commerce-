package com.belledonne.ecommerce.repository;

import com.belledonne.ecommerce.entity.InventoryHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface InventoryHistoryRepository extends JpaRepository<InventoryHistory, UUID> {
    Page<InventoryHistory> findByProductIdOrderByCreatedAtDesc(UUID productId, Pageable pageable);
}
