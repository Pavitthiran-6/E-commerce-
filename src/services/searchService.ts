import axiosInstance from '../api/axiosInstance';
import { ENDPOINTS } from '../api/endpoints';

export interface SearchAnalytics {
  id: number;
  searchTerm: string;
  searchCount: number;
  lastSearchedAt: string;
}

export interface SearchSynonym {
  id: number;
  keyword: string;
  mappedTerm: string;
  createdAt: string;
}

let synonymsPromise: Promise<SearchSynonym[]> | null = null;

/**
 * Fetch public list of synonyms and cache the Promise to avoid duplicate hits on search focus.
 */
export const getSynonyms = (force = false): Promise<SearchSynonym[]> => {
  if (!synonymsPromise || force) {
    synonymsPromise = axiosInstance
      .get(ENDPOINTS.SYNONYMS)
      .then((res) => res.data.data || [])
      .catch((err) => {
        console.error('Failed to fetch search synonyms', err);
        synonymsPromise = null;
        return [];
      });
  }
  return synonymsPromise;
};

/**
 * Fetch top trending search terms.
 */
export const getTrendingSearches = async (limit = 10): Promise<SearchAnalytics[]> => {
  const response = await axiosInstance.get(`${ENDPOINTS.SEARCH_TRENDING}?limit=${limit}`);
  return response.data.data || [];
};

/**
 * Admin: Get all synonyms.
 */
export const adminGetSynonyms = async (): Promise<SearchSynonym[]> => {
  const response = await axiosInstance.get(ENDPOINTS.ADMIN_SYNONYMS);
  return response.data.data || [];
};

/**
 * Admin: Add a new synonym mapping.
 */
export const createSynonym = async (keyword: string, mappedTerm: string): Promise<SearchSynonym> => {
  const response = await axiosInstance.post(ENDPOINTS.ADMIN_SYNONYMS, { keyword, mappedTerm });
  // Invalidate public cache
  synonymsPromise = null;
  return response.data.data;
};

/**
 * Admin: Edit an existing synonym mapping.
 */
export const updateSynonym = async (id: number, keyword: string, mappedTerm: string): Promise<SearchSynonym> => {
  const response = await axiosInstance.put(ENDPOINTS.ADMIN_SYNONYM_BY_ID(id), { keyword, mappedTerm });
  // Invalidate public cache
  synonymsPromise = null;
  return response.data.data;
};

/**
 * Admin: Delete a synonym.
 */
export const deleteSynonym = async (id: number): Promise<void> => {
  await axiosInstance.delete(ENDPOINTS.ADMIN_SYNONYM_BY_ID(id));
  // Invalidate public cache
  synonymsPromise = null;
};
