import axiosInstance from '../api/axiosInstance';
import { ENDPOINTS } from '../api/endpoints';
import type { Product } from '../data/products';

export const getWishlistAPI = async (): Promise<Product[]> => {
  const response = await axiosInstance.get(ENDPOINTS.WISHLIST);
  return response.data.data;
};

export const addToWishlistAPI = async (productId: string) => {
  const response = await axiosInstance.post(`${ENDPOINTS.WISHLIST}/add`, { productId });
  return response.data;
};

export const removeFromWishlistAPI = async (productId: string) => {
  const response = await axiosInstance.delete(`${ENDPOINTS.WISHLIST}/remove/${productId}`);
  return response.data;
};

export const checkInWishlistAPI = async (productId: string): Promise<boolean> => {
  const response = await axiosInstance.get(`${ENDPOINTS.WISHLIST}/check/${productId}`);
  return response.data.data.inWishlist;
};

export const clearWishlistAPI = async () => {
  const response = await axiosInstance.delete(`${ENDPOINTS.WISHLIST}/clear`);
  return response.data;
};
