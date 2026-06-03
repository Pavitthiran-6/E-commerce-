package com.belledonne.ecommerce.service;

import com.belledonne.ecommerce.entity.SearchAnalytics;
import com.belledonne.ecommerce.entity.SearchSynonym;
import com.belledonne.ecommerce.exception.BadRequestException;
import com.belledonne.ecommerce.exception.ResourceNotFoundException;
import com.belledonne.ecommerce.repository.SearchAnalyticsRepository;
import com.belledonne.ecommerce.repository.SearchSynonymRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional
public class SearchService {

    private final SearchAnalyticsRepository searchAnalyticsRepository;
    private final SearchSynonymRepository searchSynonymRepository;

    public void recordSearch(String query) {
        if (query == null || query.isBlank()) {
            return;
        }
        String trimmed = query.trim();
        Optional<SearchAnalytics> existing = searchAnalyticsRepository.findBySearchTermIgnoreCase(trimmed);
        if (existing.isPresent()) {
            SearchAnalytics entry = existing.get();
            entry.setSearchCount(entry.getSearchCount() + 1);
            entry.setLastSearchedAt(LocalDateTime.now());
            searchAnalyticsRepository.save(entry);
        } else {
            SearchAnalytics entry = SearchAnalytics.builder()
                .searchTerm(trimmed)
                .searchCount(1)
                .lastSearchedAt(LocalDateTime.now())
                .build();
            searchAnalyticsRepository.save(entry);
        }
    }

    @Transactional(readOnly = true)
    public String getExpandedTerms(String query) {
        if (query == null || query.isBlank()) {
            return "";
        }
        String trimmed = query.trim().toLowerCase();
        Set<String> termsSet = new LinkedHashSet<>();
        termsSet.add(trimmed); // Always search original term first

        // 1. Exact match checks
        List<SearchSynonym> exactSyns = searchSynonymRepository.findByKeywordIgnoreCase(trimmed);
        for (SearchSynonym syn : exactSyns) {
            termsSet.add(syn.getMappedTerm().toLowerCase());
        }

        // 2. Token-by-token checks for phrases (e.g. "cool fridge" -> "cool refrigerator")
        String[] tokens = trimmed.split("\\s+");
        if (tokens.length > 1) {
            for (String token : tokens) {
                List<SearchSynonym> tokenSyns = searchSynonymRepository.findByKeywordIgnoreCase(token);
                for (SearchSynonym syn : tokenSyns) {
                    String expanded = trimmed.replace(token, syn.getMappedTerm().toLowerCase());
                    termsSet.add(expanded);
                }
            }
        }

        return String.join("|", termsSet);
    }

    // --- Search Analytics Endpoints ---
    @Transactional(readOnly = true)
    public List<SearchAnalytics> getTrendingSearches(int limit) {
        return searchAnalyticsRepository.findByOrderBySearchCountDesc(PageRequest.of(0, limit)).getContent();
    }

    // --- Synonyms CRUD ---
    @Transactional(readOnly = true)
    public List<SearchSynonym> getAllSynonyms() {
        return searchSynonymRepository.findAllByOrderByCreatedAtDesc();
    }

    public SearchSynonym createSynonym(String keyword, String mappedTerm) {
        if (keyword == null || keyword.isBlank() || mappedTerm == null || mappedTerm.isBlank()) {
            throw new BadRequestException("Keyword and mapped term are required");
        }
        String kw = keyword.trim().toLowerCase();
        String mt = mappedTerm.trim().toLowerCase();

        if (searchSynonymRepository.existsByKeywordIgnoreCaseAndMappedTermIgnoreCase(kw, mt)) {
            throw new BadRequestException("Synonym mapping '" + kw + "' -> '" + mt + "' already exists");
        }

        SearchSynonym synonym = SearchSynonym.builder()
            .keyword(kw)
            .mappedTerm(mt)
            .build();
        return searchSynonymRepository.save(synonym);
    }

    public SearchSynonym updateSynonym(Long id, String keyword, String mappedTerm) {
        if (keyword == null || keyword.isBlank() || mappedTerm == null || mappedTerm.isBlank()) {
            throw new BadRequestException("Keyword and mapped term are required");
        }
        SearchSynonym synonym = searchSynonymRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("SearchSynonym", "id", id));

        String kw = keyword.trim().toLowerCase();
        String mt = mappedTerm.trim().toLowerCase();

        // Check duplicate if values changed
        if (!synonym.getKeyword().equalsIgnoreCase(kw) || !synonym.getMappedTerm().equalsIgnoreCase(mt)) {
            if (searchSynonymRepository.existsByKeywordIgnoreCaseAndMappedTermIgnoreCase(kw, mt)) {
                throw new BadRequestException("Synonym mapping '" + kw + "' -> '" + mt + "' already exists");
            }
        }

        synonym.setKeyword(kw);
        synonym.setMappedTerm(mt);
        return searchSynonymRepository.save(synonym);
    }

    public void deleteSynonym(Long id) {
        SearchSynonym synonym = searchSynonymRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("SearchSynonym", "id", id));
        searchSynonymRepository.delete(synonym);
    }
}
