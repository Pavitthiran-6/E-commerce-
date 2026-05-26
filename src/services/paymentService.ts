import axiosInstance from '../api/axiosInstance';
import { ENDPOINTS } from '../api/endpoints';

export interface RazorpayOrder {
  id: string; // Razorpay Order ID
  amount: number;
  currency: string;
}

export const createPaymentOrder = async (orderId: string): Promise<RazorpayOrder> => {
  try {
    const response = await axiosInstance.post(ENDPOINTS.CREATE_PAYMENT_ORDER, { orderId });
    return response.data.data;
  } catch (error) {
    console.error("Error creating payment order", error);
    throw error;
  }
};

export const verifyPayment = async (
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
): Promise<any> => {
  try {
    const response = await axiosInstance.post(ENDPOINTS.VERIFY_PAYMENT, {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });
    return response.data.data;
  } catch (error) {
    console.error("Error verifying payment", error);
    throw error;
  }
};
