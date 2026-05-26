import axiosInstance from '../api/axiosInstance';
import { ENDPOINTS } from '../api/endpoints';

export interface Coupon {
  id: number;
  code: string;
  description: string;
  discountType: 'PERCENTAGE' | 'FLAT';
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount: number;
  validUntil: string;
}

export const getActiveCoupons = async (): Promise<Coupon[]> => {
  const response = await axiosInstance.get(ENDPOINTS.COUPONS);
  return response.data.data;
};

export const validateCoupon = async (code: string, cartTotal: number): Promise<Coupon> => {
  const response = await axiosInstance.post(`${ENDPOINTS.COUPONS}/validate`, null, {
    params: { code, cartTotal }
  });
  return response.data.data;
};
