package com.belledonne.ecommerce.repository;

import com.belledonne.ecommerce.entity.HeroSection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface HeroSectionRepository extends JpaRepository<HeroSection, Long> {
}
