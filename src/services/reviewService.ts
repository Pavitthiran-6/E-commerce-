import axiosInstance from '../api/axiosInstance';
import { ENDPOINTS } from '../api/endpoints';

export interface Review {
  id: number;
  userId: string;
  userName: string; // Assuming the backend returns this
  productId: string;
  rating: number;
  comment: string;
  images?: string[];
  createdAt: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export const getProductReviews = async (productId: string, page = 0, size = 10): Promise<PageResponse<Review>> => {
  const response = await axiosInstance.get(`${ENDPOINTS.REVIEWS}/product/${productId}`, {
    params: { page, size }
  });
  return response.data.data;
};

export const addReview = async (productId: string, rating: number, comment: string, images?: string[]): Promise<Review> => {
  const response = await axiosInstance.post(ENDPOINTS.REVIEWS, { productId, rating, comment, images });
  return response.data.data;
};

export const updateReview = async (id: number, rating: number, comment: string): Promise<Review> => {
  const response = await axiosInstance.put(`${ENDPOINTS.REVIEWS}/${id}`, { rating, comment });
  return response.data.data;
};

export const deleteReview = async (id: number): Promise<void> => {
  await axiosInstance.delete(`${ENDPOINTS.REVIEWS}/${id}`);
};
