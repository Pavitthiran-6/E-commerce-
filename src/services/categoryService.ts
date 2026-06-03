import axiosInstance from '../api/axiosInstance';

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  children: Category[];
}

let cachedCategoriesPromise: Promise<Category[]> | null = null;

export function getCategoriesTree(): Promise<Category[]> {
  if (!cachedCategoriesPromise) {
    cachedCategoriesPromise = axiosInstance
      .get('/api/categories/tree')
      .then((res) => res.data?.data || [])
      .catch((err) => {
        cachedCategoriesPromise = null;
        throw err;
      });
  }
  return cachedCategoriesPromise;
}
