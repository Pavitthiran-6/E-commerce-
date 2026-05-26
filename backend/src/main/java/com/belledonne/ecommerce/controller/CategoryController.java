package com.belledonne.ecommerce.controller;

import com.belledonne.ecommerce.dto.response.ApiResponse;
import com.belledonne.ecommerce.service.CategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
@Tag(name = "Categories", description = "Public Category tree endpoints")
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping("/tree")
    @Operation(summary = "Get all active categories in a hierarchical tree structure")
    public ResponseEntity<ApiResponse<?>> getCategoriesTree() {
        return ResponseEntity.ok(ApiResponse.success(
            "Category tree fetched successfully",
            categoryService.getActiveCategoriesTree()
        ));
    }
}
