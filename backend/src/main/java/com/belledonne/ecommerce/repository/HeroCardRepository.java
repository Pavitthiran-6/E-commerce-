package com.belledonne.ecommerce.repository;

import com.belledonne.ecommerce.entity.HeroCard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface HeroCardRepository extends JpaRepository<HeroCard, Long> {
}
