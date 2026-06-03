import { useState, useEffect, useCallback } from 'react';
import { getCategoriesTree } from '../services/categoryService';

export interface FlatCategory {
  id: number;
  name: string;
  slug: string;
  isMain: boolean;
  parentSlug?: string;
}

export function useCategorySearch() {
  const [flatCategories, setFlatCategories] = useState<FlatCategory[]>([]);
  const [suggestions, setSuggestions] = useState<FlatCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    getCategoriesTree()
      .then((tree) => {
        if (!active) return;
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
            });
          }
        }
        setFlatCategories(flat);
      })
      .catch((err) => {
        console.error('Failed to load category search index', err);
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
        setSuggestions([]);
        return;
      }

      const matches = flatCategories.filter((cat) =>
        cat.name.toLowerCase().includes(trimmed)
      );

      setSuggestions(matches.slice(0, 8));
    },
    [flatCategories]
  );

  return { suggestions, searchCategories, setSuggestions, isLoading };
}
