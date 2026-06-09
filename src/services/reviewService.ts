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
  isVerifiedPurchase?: boolean;
  isApproved?: boolean;
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

export interface AdminReview {
  id: number;
  productId: string;
  userId: string;
  userName: string;
  userEmail: string;
  rating: number;
  title: string;
  comment: string;
  isVerifiedPurchase: boolean;
  isApproved: boolean;
  images?: string[];
  createdAt: string;
}

export const getReviewsAdmin = async (
  approved?: boolean,
  productId?: string,
  rating?: number,
  page = 0,
  size = 20
): Promise<PageResponse<AdminReview>> => {
  const params: Record<string, any> = { page, size };
  if (approved !== undefined) params.approved = approved;
  if (productId) params.productId = productId;
  if (rating !== undefined) params.rating = rating;

  const response = await axiosInstance.get('/api/admin/reviews', { params });
  return response.data.data;
};

export const approveReview = async (id: number): Promise<AdminReview> => {
  const response = await axiosInstance.patch(`/api/admin/reviews/${id}/approve`);
  return response.data.data;
};

export const rejectReview = async (id: number): Promise<AdminReview> => {
  const response = await axiosInstance.patch(`/api/admin/reviews/${id}/reject`);
  return response.data.data;
};

export const deleteReviewAdmin = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/api/admin/reviews/${id}`);
};

export const checkCanReview = async (productId: string): Promise<{ canReview: boolean; reason: string }> => {
  const response = await axiosInstance.get(`/api/reviews/can-review/${productId}`);
  return response.data.data;
};
