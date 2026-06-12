package com.belledonne.ecommerce.repository;

import com.belledonne.ecommerce.entity.ShippingSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface ShippingSettingsRepository extends JpaRepository<ShippingSettings, UUID> {
}
