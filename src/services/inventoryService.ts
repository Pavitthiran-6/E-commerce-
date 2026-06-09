import axiosInstance from '../api/axiosInstance';
import { ENDPOINTS } from '../api/endpoints';

export interface InventoryItem {
  productId: string;
  productName: string;
  slug: string;
  productImage?: string;
  variantId?: number;
  size?: string;
  color?: string;
  stockQuantity: number;
  lowStockThreshold: number;
  isLowStock: boolean;
  isOutOfStock: boolean;
}

export interface InventoryHistoryLog {
  id: string;
  productId: string;
  variantId?: number;
  quantityChanged: number;
  resultingStock: number;
  actionType: string;
  notes?: string;
  changedBy?: string;
  createdAt: string;
}

export interface InventoryPage {
  content: InventoryItem[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}

export interface InventoryHistoryPage {
  content: InventoryHistoryLog[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}

export interface InventoryReports {
  currentStock: number;
  reservedStock: number;
  soldStock: number;
  lowStockCount: number;
  outOfStockCount: number;
}

export const getInventoryList = async (
  search = '',
  lowStock = false,
  outOfStock = false,
  page = 0,
  size = 20
): Promise<InventoryPage> => {
  try {
    let url = `${ENDPOINTS.ADMIN_INVENTORY}?page=${page}&size=${size}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (lowStock) url += `&lowStock=true`;
    if (outOfStock) url += `&outOfStock=true`;

    const response = await axiosInstance.get(url);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching inventory list', error);
    throw error;
  }
};

export const adjustStock = async (
  productId: string,
  variantId: number | null,
  newQuantity: number,
  notes: string
): Promise<InventoryItem> => {
  try {
    const response = await axiosInstance.post(ENDPOINTS.ADMIN_INVENTORY_ADJUST, {
      productId,
      variantId,
      newQuantity,
      notes
    });
    return response.data.data;
  } catch (error) {
    console.error('Error adjusting stock', error);
    throw error;
  }
};

export const getInventoryReports = async (): Promise<InventoryReports> => {
  try {
    const response = await axiosInstance.get(ENDPOINTS.ADMIN_INVENTORY_REPORTS);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching inventory reports', error);
    throw error;
  }
};

export const getInventoryHistory = async (
  productId: string,
  page = 0,
  size = 20
): Promise<InventoryHistoryPage> => {
  try {
    const response = await axiosInstance.get(
      `${ENDPOINTS.ADMIN_INVENTORY_HISTORY}?productId=${productId}&page=${page}&size=${size}`
    );
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching inventory history for product ${productId}`, error);
    throw error;
  }
};
