/**
 * Shared Product type used across the entire application.
 * This is the canonical source of truth for the Product shape,
 * matching the backend's ProductResponse DTO.
 */
export interface Product {
  id: string;
  name: string;
  slug?: string;
  brand: string;
  category: string;
  subCategory: string;
  price: number;
  originalPrice: number;
  discount: number;
  images: string[];
  colors: string[];
  sizes: string[];
  description: string;
  tags: string[];
  rating: number;
  reviewCount: number;
  inStock: boolean;
  isNew: boolean;
  arrivalTag?: string;
  isBestseller: boolean;
  isApparelHighlights?: boolean;
  isTechHome?: boolean;
  isOnSale?: boolean;
  createdAt: string;
  gender?: string;
  priceNum?: number;
  productType?: string;
  image?: string;
  discountPercentage?: number;
  shortDescription?: string;
  materialsTitle?: string;
  materialsContent?: string;
  shippingTitle?: string;
  shippingContent?: string;
  careTitle?: string;
  careContent?: string;
  sustainabilityTitle?: string;
  sustainabilityContent?: string;
  craftsmanshipTitle?: string;
  craftsmanshipContent?: string;
  freeShipping?: boolean;
  codAvailable?: boolean;
  easyReturns?: boolean;
  stockQuantity?: number;
  specifications?: {
    key: string;
    value: string;
    displayOrder?: number;
  }[];
}
