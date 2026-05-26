import axiosInstance from '../api/axiosInstance';
import { ENDPOINTS } from '../api/endpoints';

export interface OrderItem {
  id: number;
  productName: string;
  productImage: string;
  size?: string;
  color?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Address {
  fullName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface OrderTracking {
  status: string;
  message: string;
  location?: string;
  trackingTime: string;
}

export interface Order {
  id: string; // Backend returns UUID
  orderNumber: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  subtotal: number;
  shippingCharge: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  couponCode?: string;
  paymentMethod: string;
  paymentStatus: string;
  estimatedDelivery?: string;
  deliveredAt?: string;
  trackingNumber?: string;
  address: Address;
  items: OrderItem[];
  trackingHistory?: OrderTracking[];
  createdAt: string;
}

export const placeOrder = async (orderData: { addressId: number; paymentMethod: string; couponCode?: string; items?: { productId: string; variantId?: number; quantity: number }[] }): Promise<Order> => {
  try {
    const response = await axiosInstance.post(ENDPOINTS.ORDERS, orderData);
    return response.data.data;
  } catch (error) {
    console.error("Error placing order", error);
    throw error;
  }
};

export const getOrders = async (page = 0, size = 10): Promise<{ content: Order[], totalPages: number }> => {
  try {
    const response = await axiosInstance.get(`${ENDPOINTS.ORDERS}?page=${page}&size=${size}`);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching orders", error);
    throw error;
  }
};

export const getOrderById = async (orderId: string): Promise<Order> => {
  try {
    const response = await axiosInstance.get(ENDPOINTS.ORDER_BY_ID(orderId));
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching order ${orderId}`, error);
    throw error;
  }
};

export const cancelOrder = async (orderId: string): Promise<Order> => {
  try {
    const response = await axiosInstance.put(ENDPOINTS.CANCEL_ORDER(orderId));
    return response.data.data;
  } catch (error) {
    console.error(`Error cancelling order ${orderId}`, error);
    throw error;
  }
};

export const trackOrder = async (orderId: string): Promise<OrderTracking[]> => {
  try {
    const response = await axiosInstance.get(ENDPOINTS.TRACK_ORDER(orderId));
    return response.data.data;
  } catch (error) {
    console.error(`Error tracking order ${orderId}`, error);
    throw error;
  }
};
