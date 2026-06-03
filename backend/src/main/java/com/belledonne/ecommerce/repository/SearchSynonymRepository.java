package com.belledonne.ecommerce.repository;

import com.belledonne.ecommerce.entity.SearchSynonym;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SearchSynonymRepository extends JpaRepository<SearchSynonym, Long> {
    List<SearchSynonym> findByKeywordIgnoreCase(String keyword);
    List<SearchSynonym> findAllByOrderByCreatedAtDesc();
    boolean existsByKeywordIgnoreCaseAndMappedTermIgnoreCase(String keyword, String mappedTerm);
}
