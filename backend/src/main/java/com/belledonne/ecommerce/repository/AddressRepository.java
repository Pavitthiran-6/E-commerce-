package com.belledonne.ecommerce.repository;

import com.belledonne.ecommerce.entity.Address;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AddressRepository extends JpaRepository<Address, Long> {
    List<Address> findByUserIdOrderByIsDefaultDescCreatedAtDesc(UUID userId);
    Optional<Address> findByUserIdAndIsDefaultTrue(UUID userId);
}
