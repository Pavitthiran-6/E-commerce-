import axiosInstance from '../api/axiosInstance';
import { ENDPOINTS } from '../api/endpoints';

export interface CartItem {
  id: number;
  productId: string;
  productName: string;
  productImage: string;
  size: string;
  color: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export interface Cart {
  cartId: string;
  items: CartItem[];
  subtotal: number;
  itemCount: number;
}

export const getCart = async (): Promise<Cart> => {
  const response = await axiosInstance.get(ENDPOINTS.CART);
  return response.data.data;
};

export const addToCartAPI = async (productId: string, quantity: number, variantId?: number) => {
  const response = await axiosInstance.post(ENDPOINTS.CART + '/add', {
    productId,
    quantity,
    variantId
  });
  return response.data.data;
};

export const updateCartItemAPI = async (itemId: string, quantity: number) => {
  const response = await axiosInstance.put(`${ENDPOINTS.CART}/update/${itemId}`, { quantity });
  return response.data.data;
};

export const removeCartItemAPI = async (itemId: string) => {
  const response = await axiosInstance.delete(`${ENDPOINTS.CART}/remove/${itemId}`);
  return response.data.data;
};

export const clearCartAPI = async () => {
  const response = await axiosInstance.delete(`${ENDPOINTS.CART}/clear`);
  return response.data;
};

export const getCartCountAPI = async (): Promise<number> => {
  const response = await axiosInstance.get(`${ENDPOINTS.CART}/count`);
  return response.data.data.count;
};
