import { useState, useEffect, useCallback } from 'react';
import { getCategoriesTree } from '../services/categoryService';
import { getAllProductsPaged } from '../services/productService';
import type { Product } from '../types/product';

export interface FlatCategory {
  id: number;
  name: string;
  slug: string;
  isMain: boolean;
  parentSlug?: string;
  parentName?: string;
}

export interface SearchSuggestions {
  categories: FlatCategory[];
  products: Product[];
}

export function useCategorySearch() {
  const [flatCategories, setFlatCategories] = useState<FlatCategory[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestions>({ categories: [], products: [] });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setIsLoading(true);

    Promise.all([
      getCategoriesTree(),
      getAllProductsPaged(0, 200).catch((err) => {
        console.error('Failed to load products list', err);
        return { content: [], totalElements: 0 };
      })
    ])
      .then(([tree, productsRes]) => {
        if (!active) return;
        
        // Flatten categories
        const flat: FlatCategory[] = [];
        for (const parent of tree) {
          flat.push({
            id: parent.id,
            name: parent.name,
            slug: parent.slug,
            isMain: true,
          });
          for (const child of parent.children || []) {
            flat.push({
              id: child.id,
              name: child.name,
              slug: child.slug,
              isMain: false,
              parentSlug: parent.slug,
              parentName: parent.name,
            });
          }
        }
        setFlatCategories(flat);
        setAllProducts(productsRes.content || []);
      })
      .catch((err) => {
        console.error('Failed to load category or product search indexes', err);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const searchCategories = useCallback(
    (query: string) => {
      const trimmed = query.trim().toLowerCase();
      if (!trimmed) {
        setSuggestions({ categories: [], products: [] });
        return;
      }

      // 1. Filter categories:
      // Include any category matching query. If parent matches, include all children. If child matches, include parent and all siblings.
      const directMatches = flatCategories.filter(cat => cat.name.toLowerCase().includes(trimmed));
      const matchedCategoryIds = new Set<number>();
      const matchedCategories: FlatCategory[] = [];

      const addCategory = (cat: FlatCategory) => {
        if (!matchedCategoryIds.has(cat.id)) {
          matchedCategoryIds.add(cat.id);
          matchedCategories.push(cat);
        }
      };

      for (const cat of directMatches) {
        if (cat.isMain) {
          addCategory(cat);
          flatCategories.filter(c => c.parentSlug === cat.slug).forEach(addCategory);
        } else {
          addCategory(cat);
          const parent = flatCategories.find(p => p.isMain && p.slug === cat.parentSlug);
          if (parent) {
            addCategory(parent);
            flatCategories.filter(c => c.parentSlug === parent.slug).forEach(addCategory);
          }
        }
      }

      // 2. Filter products:
      // Product name, brand, keywords, tags, description, category, subcategory match.
      const matchedProducts = allProducts
        .map((prod) => {
          let score = 0;
          const nameMatches = prod.name.toLowerCase().includes(trimmed);
          const brandMatches = prod.brand && prod.brand.toLowerCase().includes(trimmed);
          const keywordMatches = prod.keywords && prod.keywords.toLowerCase().includes(trimmed);
          const tagMatches = prod.tags && prod.tags.some(tag => tag.toLowerCase().includes(trimmed));
          const descMatches = (prod.description && prod.description.toLowerCase().includes(trimmed)) ||
                              (prod.shortDescription && prod.shortDescription.toLowerCase().includes(trimmed));

          // Resolve main and sub categories
          const pCatName = (prod.categoryName || prod.category || '').toLowerCase();
          const match = flatCategories.find(c => c.name.toLowerCase() === pCatName);
          
          let mainCategoryName = '';
          let subCategoryName = '';
          
          if (match) {
            if (match.isMain) {
              mainCategoryName = match.name;
            } else {
              subCategoryName = match.name;
              mainCategoryName = match.parentName || '';
            }
          } else {
            mainCategoryName = pCatName;
          }

          const categoryMatches = mainCategoryName && mainCategoryName.toLowerCase().includes(trimmed);
          const subCategoryMatches = subCategoryName && subCategoryName.toLowerCase().includes(trimmed);

          if (nameMatches) score = Math.max(score, 100);
          if (brandMatches) score = Math.max(score, 80);
          if (keywordMatches) score = Math.max(score, 60);
          if (tagMatches) score = Math.max(score, 40);
          if (descMatches) score = Math.max(score, 20);
          if (categoryMatches) score = Math.max(score, 10);
          if (subCategoryMatches) score = Math.max(score, 5);

          return { prod, score };
        })
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((item) => item.prod);

      // 3. Balance suggestions to ensure we have a maximum of 10:
      let finalCategories: FlatCategory[] = [];
      let finalProducts: Product[] = [];
      
      if (matchedCategories.length > 5 && matchedProducts.length > 5) {
        finalCategories = matchedCategories.slice(0, 5);
        finalProducts = matchedProducts.slice(0, 5);
      } else if (matchedCategories.length <= 5) {
        finalCategories = matchedCategories;
        finalProducts = matchedProducts.slice(0, 10 - matchedCategories.length);
      } else {
        finalProducts = matchedProducts;
        finalCategories = matchedCategories.slice(0, 10 - matchedProducts.length);
      }

      setSuggestions({
        categories: finalCategories,
        products: finalProducts,
      });
    },
    [flatCategories, allProducts]
  );

  return { suggestions, searchCategories, setSuggestions, isLoading };
}
