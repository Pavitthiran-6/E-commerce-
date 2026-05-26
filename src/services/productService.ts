import axiosInstance from '../api/axiosInstance';
import { ENDPOINTS } from '../api/endpoints';
import type { Product } from '../data/products'; // Keep type definition if it's there

export const getAllProducts = async (): Promise<Product[]> => {
  const response = await axiosInstance.get(ENDPOINTS.PRODUCTS);
  // Backend returns ApiResponse where data is a Page object
  return response.data.data?.content || [];
};

export const getProductById = async (id: string): Promise<Product> => {
  const response = await axiosInstance.get(ENDPOINTS.PRODUCT_BY_ID(id));
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

export const getNewArrivals = async (): Promise<Product[]> => {
  const response = await axiosInstance.get(`${ENDPOINTS.PRODUCTS}/new-arrivals`);
  return response.data.data?.content || [];
};

export const getSaleProducts = async (): Promise<Product[]> => {
  const response = await axiosInstance.get(`${ENDPOINTS.PRODUCTS}/sale`);
  return response.data.data?.content || [];
};
