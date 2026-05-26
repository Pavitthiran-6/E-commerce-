package com.belledonne.ecommerce.service;

import com.belledonne.ecommerce.dto.request.CategoryRequest;
import com.belledonne.ecommerce.dto.response.CategoryTreeResponse;
import com.belledonne.ecommerce.entity.Category;
import com.belledonne.ecommerce.exception.BadRequestException;
import com.belledonne.ecommerce.exception.ResourceNotFoundException;
import com.belledonne.ecommerce.repository.CategoryRepository;
import com.belledonne.ecommerce.repository.ProductRepository;
import com.belledonne.ecommerce.util.SlugUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    public List<CategoryTreeResponse> getActiveCategoriesTree() {
        return categoryRepository.findByParentIsNullAndIsActiveTrue()
            .stream()
            .map(this::toTreeResponse)
            .collect(Collectors.toList());
    }

    public List<Category> getAllCategoriesAdmin() {
        return categoryRepository.findAll();
    }

    public Category createCategory(CategoryRequest request) {
        String slug = (request.getSlug() != null && !request.getSlug().isBlank())
            ? SlugUtil.toSlug(request.getSlug())
            : SlugUtil.toSlug(request.getName());

        if (categoryRepository.findBySlug(slug).isPresent()) {
            throw new BadRequestException("Category with slug '" + slug + "' already exists");
        }

        Category parent = null;
        if (request.getParentId() != null) {
            parent = categoryRepository.findById(request.getParentId())
                .orElseThrow(() -> new ResourceNotFoundException("Parent Category", "id", request.getParentId()));
        }

        Category category = Category.builder()
            .name(request.getName().trim())
            .slug(slug)
            .parent(parent)
            .description(request.getDescription())
            .imageUrl(request.getImageUrl())
            .isActive(true)
            .build();

        return categoryRepository.save(category);
    }

    public Category updateCategory(Long id, CategoryRequest request) {
        Category category = categoryRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Category", "id", id));

        String slug = (request.getSlug() != null && !request.getSlug().isBlank())
            ? SlugUtil.toSlug(request.getSlug())
            : SlugUtil.toSlug(request.getName());

        if (!category.getSlug().equals(slug) && categoryRepository.findBySlug(slug).isPresent()) {
            throw new BadRequestException("Category with slug '" + slug + "' already exists");
        }

        Category parent = null;
        if (request.getParentId() != null) {
            if (request.getParentId().equals(id)) {
                throw new BadRequestException("A category cannot be its own parent");
            }
            parent = categoryRepository.findById(request.getParentId())
                .orElseThrow(() -> new ResourceNotFoundException("Parent Category", "id", request.getParentId()));
        }

        category.setName(request.getName().trim());
        category.setSlug(slug);
        category.setParent(parent);
        category.setDescription(request.getDescription());
        category.setImageUrl(request.getImageUrl());

        return categoryRepository.save(category);
    }

    public void deleteCategory(Long id) {
        Category category = categoryRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Category", "id", id));

        if (productRepository.existsByCategoryId(id)) {
            throw new BadRequestException("Cannot delete category as it has products linked to it");
        }

        categoryRepository.delete(category);
    }

    public Category toggleCategory(Long id) {
        Category category = categoryRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Category", "id", id));
        category.setIsActive(!category.getIsActive());
        return categoryRepository.save(category);
    }

    private CategoryTreeResponse toTreeResponse(Category c) {
        List<CategoryTreeResponse> childResponses = c.getChildren()
            .stream()
            .filter(Category::getIsActive)
            .map(this::toTreeResponse)
            .collect(Collectors.toList());

        return CategoryTreeResponse.builder()
            .id(c.getId())
            .name(c.getName())
            .slug(c.getSlug())
            .description(c.getDescription())
            .imageUrl(c.getImageUrl())
            .children(childResponses)
            .build();
    }
}
