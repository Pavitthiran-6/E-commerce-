package com.belledonne.ecommerce.controller;

import com.belledonne.ecommerce.dto.request.SynonymRequest;
import com.belledonne.ecommerce.dto.response.ApiResponse;
import com.belledonne.ecommerce.entity.SearchSynonym;
import com.belledonne.ecommerce.service.SearchService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Search", description = "Trending search analytics and synonyms endpoints")
public class SearchController {

    private final SearchService searchService;

    @GetMapping("/search/trending")
    @Operation(summary = "Get top trending search terms")
    public ResponseEntity<ApiResponse<?>> getTrendingSearches(@RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(ApiResponse.success(
            "Trending searches fetched successfully",
            searchService.getTrendingSearches(limit)
        ));
    }

    @GetMapping("/synonyms")
    @Operation(summary = "Get all synonyms (public)")
    public ResponseEntity<ApiResponse<?>> getSynonyms() {
        return ResponseEntity.ok(ApiResponse.success(
            "Synonyms fetched successfully",
            searchService.getAllSynonyms()
        ));
    }

    @GetMapping("/admin/synonyms")
    @Operation(summary = "Get all synonyms for admin view")
    public ResponseEntity<ApiResponse<?>> getAdminSynonyms() {
        return ResponseEntity.ok(ApiResponse.success(
            "Admin synonyms fetched successfully",
            searchService.getAllSynonyms()
        ));
    }

    @PostMapping("/admin/synonyms")
    @Operation(summary = "Create a new search synonym mapping")
    public ResponseEntity<ApiResponse<?>> createSynonym(@RequestBody SynonymRequest request) {
        SearchSynonym created = searchService.createSynonym(request.getKeyword(), request.getMappedTerm());
        return ResponseEntity.ok(ApiResponse.success(
            "Synonym created successfully",
            created
        ));
    }

    @PutMapping("/admin/synonyms/{id}")
    @Operation(summary = "Update an existing search synonym mapping")
    public ResponseEntity<ApiResponse<?>> updateSynonym(@PathVariable Long id, @RequestBody SynonymRequest request) {
        SearchSynonym updated = searchService.updateSynonym(id, request.getKeyword(), request.getMappedTerm());
        return ResponseEntity.ok(ApiResponse.success(
            "Synonym updated successfully",
            updated
        ));
    }

    @DeleteMapping("/admin/synonyms/{id}")
    @Operation(summary = "Delete an existing search synonym mapping")
    public ResponseEntity<ApiResponse<?>> deleteSynonym(@PathVariable Long id) {
        searchService.deleteSynonym(id);
        return ResponseEntity.ok(ApiResponse.success(
            "Synonym deleted successfully"
        ));
    }
}
