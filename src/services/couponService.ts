import axiosInstance from '../api/axiosInstance';
import { ENDPOINTS } from '../api/endpoints';

export interface Coupon {
  code: string;
  description: string;
  minOrderValue: number;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
}

export const getActiveCoupons = async (): Promise<Coupon[]> => {
  const response = await axiosInstance.get(`${ENDPOINTS.COUPONS}/available`);
  return response.data.data;
};

export const validateCoupon = async (code: string, cartTotal: number): Promise<Coupon> => {
  const response = await axiosInstance.post(`${ENDPOINTS.COUPONS}/validate`, null, {
    params: { code, cartTotal }
  });
  return response.data.data.coupon;
};
