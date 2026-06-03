package com.belledonne.ecommerce.repository;

import com.belledonne.ecommerce.entity.SearchAnalytics;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SearchAnalyticsRepository extends JpaRepository<SearchAnalytics, Long> {
    Optional<SearchAnalytics> findBySearchTermIgnoreCase(String searchTerm);
    Page<SearchAnalytics> findByOrderBySearchCountDesc(Pageable pageable);
}
