package com.belledonne.ecommerce.controller;

import com.belledonne.ecommerce.dto.response.ApiResponse;
import com.belledonne.ecommerce.service.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
@Tag(name = "Products", description = "Product catalog and search")
public class ProductController {

    private final ProductService productService;

    @GetMapping
    @Operation(summary = "Get all products with pagination")
    public ResponseEntity<ApiResponse<?>> getAll(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "12") int size,
        @RequestParam(defaultValue = "createdAt") String sort,
        @RequestParam(defaultValue = "desc") String dir) {
        Sort sortObj = dir.equalsIgnoreCase("asc") ? Sort.by(sort).ascending() : Sort.by(sort).descending();
        Pageable pageable = PageRequest.of(page, size, sortObj);
        var products = productService.getAllResponses(pageable);
        return ResponseEntity.ok(ApiResponse.success("Products fetched successfully", products));
    }

    @GetMapping("/search")
    @Operation(summary = "Search products")
    public ResponseEntity<ApiResponse<?>> search(
        @RequestParam String q,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "12") int size) {
        Pageable pageable = PageRequest.of(page, size);
        var products = productService.searchResponses(q, pageable);
        return ResponseEntity.ok(ApiResponse.success("Search results", products));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get product by ID")
    public ResponseEntity<ApiResponse<?>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success("Product fetched",
            productService.getByIdResponse(id)));
    }

    @GetMapping("/slug/{slug}")
    @Operation(summary = "Get product by slug")
    public ResponseEntity<ApiResponse<?>> getBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(ApiResponse.success("Product fetched",
            productService.getBySlugResponse(slug)));
    }

    @GetMapping("/featured")
    public ResponseEntity<ApiResponse<?>> getFeatured(
        @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "12") int size) {
        return ResponseEntity.ok(ApiResponse.success("Featured products",
            productService.getFeaturedResponses(PageRequest.of(page, size))));
    }

    @GetMapping("/new-arrivals")
    public ResponseEntity<ApiResponse<?>> getNewArrivals(
        @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "12") int size) {
        return ResponseEntity.ok(ApiResponse.success("New arrivals",
            productService.getNewArrivalsResponses(PageRequest.of(page, size))));
    }

    @GetMapping("/bestsellers")
    public ResponseEntity<ApiResponse<?>> getBestsellers(
        @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "12") int size) {
        return ResponseEntity.ok(ApiResponse.success("Bestsellers",
            productService.getBestsellersResponses(PageRequest.of(page, size))));
    }

    @GetMapping("/sale")
    public ResponseEntity<ApiResponse<?>> getSale(
        @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "12") int size) {
        return ResponseEntity.ok(ApiResponse.success("Sale products",
            productService.getSaleResponses(PageRequest.of(page, size))));
    }
}
