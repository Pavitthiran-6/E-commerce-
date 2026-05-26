import axiosInstance from '../api/axiosInstance';
import { ENDPOINTS } from '../api/endpoints';

export interface Address {
  id: number;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export const getAddresses = async (): Promise<Address[]> => {
  const response = await axiosInstance.get(ENDPOINTS.ADDRESSES);
  return response.data.data;
};

export const addAddress = async (addressData: Omit<Address, 'id' | 'isDefault'>): Promise<Address> => {
  const response = await axiosInstance.post(ENDPOINTS.ADDRESSES, addressData);
  return response.data.data;
};

export const updateAddress = async (id: number, addressData: Omit<Address, 'id' | 'isDefault'>): Promise<Address> => {
  const response = await axiosInstance.put(`${ENDPOINTS.ADDRESSES}/${id}`, addressData);
  return response.data.data;
};

export const deleteAddress = async (id: number): Promise<void> => {
  await axiosInstance.delete(`${ENDPOINTS.ADDRESSES}/${id}`);
};

export const setDefaultAddress = async (id: number): Promise<Address> => {
  const response = await axiosInstance.put(`${ENDPOINTS.ADDRESSES}/${id}/default`);
  return response.data.data;
};

// User Profile Methods
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
}

export const getUserProfile = async (): Promise<UserProfile> => {
  const response = await axiosInstance.get(ENDPOINTS.PROFILE);
  return response.data.data;
};

export const updateUserProfile = async (profileData: Partial<UserProfile>): Promise<UserProfile> => {
  const response = await axiosInstance.put(ENDPOINTS.PROFILE, profileData);
  return response.data.data;
};
