package com.belledonne.ecommerce.repository;

import com.belledonne.ecommerce.entity.SaleSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SaleSettingsRepository extends JpaRepository<SaleSettings, Long> {
    Optional<SaleSettings> findFirstByOrderByIdAsc();
}
