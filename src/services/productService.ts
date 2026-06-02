import axiosInstance from '../api/axiosInstance';
import { ENDPOINTS } from '../api/endpoints';
import type { Product } from '../types/product';

export interface SaleSettingsData {
  id?: number;
  saleTitle: string;
  saleSubtitle: string;
  maxDiscountText: string;
  saleEndDateTime: string | null;
  isActive: boolean;
  dealOfTheDayProductId?: string;
  dealProductName?: string;
  dealProductImage?: string;
  dealProductPrice?: number;
  dealProductOriginalPrice?: number;
  dealProductDiscountPercentage?: number;
  dealProductDescription?: string;
}

export const getAllProducts = async (): Promise<Product[]> => {
  const response = await axiosInstance.get(ENDPOINTS.PRODUCTS);
  // Backend returns ApiResponse where data is a Page object
  return response.data.data?.content || [];
};

export const getAllProductsPaged = async (page = 0, size = 200): Promise<{ content: Product[]; totalElements: number }> => {
  const response = await axiosInstance.get(`${ENDPOINTS.PRODUCTS}?page=${page}&size=${size}`);
  return response.data.data || { content: [], totalElements: 0 };
};

export const getProductById = async (id: string): Promise<Product> => {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  const url = isUuid ? ENDPOINTS.PRODUCT_BY_ID(id) : `/api/products/slug/${id}`;
  const response = await axiosInstance.get(url);
  return response.data.data;
};

export const getProductsByCategory = async (category: string): Promise<Product[]> => {
  const response = await axiosInstance.get(ENDPOINTS.PRODUCTS_BY_CATEGORY(category));
  return response.data.data?.content || response.data.data || [];
};

export const searchProducts = async (query: string): Promise<Product[]> => {
  const response = await axiosInstance.get(`${ENDPOINTS.PRODUCTS}/search?q=${encodeURIComponent(query)}`);
  return response.data.data?.content || [];
};

export const getFeaturedProducts = async (): Promise<Product[]> => {
  const response = await axiosInstance.get(`${ENDPOINTS.PRODUCTS}/featured`);
  return response.data.data?.content || [];
};

export const getBestsellers = async (): Promise<Product[]> => {
  const response = await axiosInstance.get(`${ENDPOINTS.PRODUCTS}/bestsellers?size=100`);
  return response.data.data?.content || [];
};

export const getNewArrivals = async (): Promise<Product[]> => {
  const response = await axiosInstance.get(`${ENDPOINTS.PRODUCTS}/new-arrivals?size=100`);
  return response.data.data?.content || [];
};

export const getSaleProducts = async (): Promise<Product[]> => {
  const response = await axiosInstance.get(`${ENDPOINTS.PRODUCTS}/sale?size=100`);
  return response.data.data?.content || [];
};

export const getApparelHighlights = async (): Promise<Product[]> => {
  const response = await axiosInstance.get(`${ENDPOINTS.PRODUCTS}/apparel-highlights?size=100`);
  return response.data.data?.content || [];
};

export const getTechHome = async (): Promise<Product[]> => {
  const response = await axiosInstance.get(`${ENDPOINTS.PRODUCTS}/tech-home?size=100`);
  return response.data.data?.content || [];
};

// ---- Sale Settings (public) ----
export const getSaleSettings = async (): Promise<SaleSettingsData> => {
  const response = await axiosInstance.get(ENDPOINTS.SALE_SETTINGS);
  return response.data.data;
};

export const getDealOfTheDay = async (): Promise<Product | null> => {
  const response = await axiosInstance.get(ENDPOINTS.SALE_DEAL_OF_THE_DAY);
  return response.data.data || null;
};

// ---- Admin Sale APIs ----
export const adminGetSaleSettings = async (): Promise<SaleSettingsData> => {
  const response = await axiosInstance.get(ENDPOINTS.ADMIN_SALE_SETTINGS);
  return response.data.data;
};

export const adminUpdateSaleSettings = async (data: Partial<SaleSettingsData>): Promise<SaleSettingsData> => {
  const response = await axiosInstance.put(ENDPOINTS.ADMIN_SALE_SETTINGS, data);
  return response.data.data;
};

export const adminUpdateDealOfTheDay = async (productId: string): Promise<SaleSettingsData> => {
  const response = await axiosInstance.put(ENDPOINTS.ADMIN_SALE_DEAL_OF_THE_DAY, { productId });
  return response.data.data;
};

export const adminUpdateProductDiscount = async (
  productId: string,
  discountPercentage: number,
  isOnSale: boolean
): Promise<Product> => {
  const response = await axiosInstance.put(ENDPOINTS.ADMIN_PRODUCT_DISCOUNT(productId), {
    discountPercentage,
    isOnSale,
  });
  return response.data.data;
};
