import axiosInstance from '../api/axiosInstance';
import { ENDPOINTS } from '../api/endpoints';

export interface HeroCardData {
  id?: number;
  title: string;
  image: string;
  discountPercentage?: number;
  backgroundColor?: string;
  displayOrder?: number;
}

export interface HeroData {
  id?: number;
  title: string;
  badge: string;
  dateRange: string;
  backgroundColor: string;
  leftIcon: string;
  rightIcon: string;

  // Featured Product Card fields
  featuredProductName: string;
  featuredProductImage: string;
  featuredOriginalPrice: number;
  featuredSalePrice: number;
  featuredDiscountPercentage: number;
  featuredCardBackgroundColor: string;

  promoCards: HeroCardData[];
}

export const getHeroSection = async (): Promise<HeroData> => {
  const response = await axiosInstance.get(ENDPOINTS.HERO);
  return response.data.data;
};

export const adminUpdateHero = async (data: HeroData): Promise<HeroData> => {
  const response = await axiosInstance.put(ENDPOINTS.ADMIN_HERO, data);
  return response.data.data;
};

export const adminDeleteHeroCard = async (id: number | string): Promise<void> => {
  await axiosInstance.delete(ENDPOINTS.ADMIN_HERO_DELETE_CARD(id));
};
