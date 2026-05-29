export interface Product {
  id: string;
  name: string;
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
  // Compatibility fields for old pages
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

export const mockProducts: Product[] = [
  // FOOTWEAR
  {
    id: 'bo-velcro',
    name: 'Bo Velcro Sneaker',
    brand: 'BELLEDONNE',
    category: 'footwear',
    subCategory: 'sneakers',
    price: 16500,
    originalPrice: 22000,
    discount: 25,
    images: ['https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=500'],
    colors: ['white', 'black', 'walnut'],
    sizes: ['6', '7', '8', '9', '10'],
    description: 'Classic minimalist sneaker featuring dual velcro straps for effortless style.',
    tags: ['shoes', 'sneakers', 'footwear', 'casual', 'leather'],
    rating: 4.8,
    reviewCount: 124,
    inStock: true,
    isNew: true,
    isBestseller: true,
    createdAt: '2024-05-01T00:00:00Z'
  },
  {
    id: 'chelsea-boot',
    name: 'Classic Chelsea Boot',
    brand: 'BELLEDONNE',
    category: 'footwear',
    subCategory: 'boots',
    price: 18000,
    originalPrice: 18000,
    discount: 0,
    images: ['https://images.unsplash.com/photo-1608256246200-53e635b5b65f?q=80&w=500'],
    colors: ['tan', 'black'],
    sizes: ['7', '8', '9', '10', '11'],
    description: 'Premium suede Chelsea boots, perfect for semi-formal and casual wear.',
    tags: ['shoes', 'boots', 'footwear', 'suede'],
    rating: 4.6,
    reviewCount: 89,
    inStock: true,
    isNew: false,
    isBestseller: false,
    createdAt: '2023-11-15T00:00:00Z'
  },
  {
    id: 'strap-heels',
    name: 'Ankle Strap Stilettos',
    brand: 'BELLEDONNE',
    category: 'footwear',
    subCategory: 'heels',
    price: 12500,
    originalPrice: 15000,
    discount: 16,
    images: ['https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=500'],
    colors: ['red', 'black', 'nude'],
    sizes: ['4', '5', '6', '7', '8'],
    description: 'Elegant stiletto heels featuring a delicate ankle strap.',
    tags: ['shoes', 'heels', 'footwear', 'party'],
    rating: 4.7,
    reviewCount: 215,
    inStock: true,
    isNew: false,
    isBestseller: true,
    createdAt: '2024-01-10T00:00:00Z'
  },

  // MEN'S CLOTHING
  {
    id: 'linen-shirt',
    name: 'Breezy Linen Shirt',
    brand: 'BELLEDONNE',
    category: 'men',
    subCategory: 'shirts',
    price: 3500,
    originalPrice: 5000,
    discount: 30,
    images: ['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=500'],
    colors: ['white', 'navy', 'olive'],
    sizes: ['S', 'M', 'L', 'XL'],
    description: '100% pure linen shirt for maximum breathability during summer.',
    tags: ['clothing', 'men', 'shirt', 'linen', 'summer'],
    rating: 4.5,
    reviewCount: 65,
    inStock: true,
    isNew: true,
    isBestseller: false,
    createdAt: '2024-04-20T00:00:00Z'
  },
  {
    id: 'chino-trousers',
    name: 'Tailored Chino Trousers',
    brand: 'BELLEDONNE',
    category: 'men',
    subCategory: 'trousers',
    price: 4200,
    originalPrice: 4200,
    discount: 0,
    images: ['https://images.unsplash.com/photo-1473966968600-fa801b869a1a?q=80&w=500'],
    colors: ['khaki', 'navy', 'black'],
    sizes: ['30', '32', '34', '36'],
    description: 'Comfortable stretch chinos tailored for a perfect fit.',
    tags: ['clothing', 'men', 'trousers', 'pants', 'formal'],
    rating: 4.8,
    reviewCount: 310,
    inStock: true,
    isNew: false,
    isBestseller: true,
    createdAt: '2023-08-05T00:00:00Z'
  },
  {
    id: 'crewneck-tee',
    name: 'Essential Crewneck T-Shirt',
    brand: 'BELLEDONNE',
    category: 'men',
    subCategory: 't-shirts',
    price: 1200,
    originalPrice: 1500,
    discount: 20,
    images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=500'],
    colors: ['white', 'black', 'grey', 'maroon'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    description: 'Premium Pima cotton t-shirt built for everyday comfort.',
    tags: ['clothing', 'men', 't-shirt', 'casual', 'essentials'],
    rating: 4.9,
    reviewCount: 840,
    inStock: true,
    isNew: false,
    isBestseller: true,
    createdAt: '2022-05-12T00:00:00Z'
  },

  // WOMEN'S CLOTHING
  {
    id: 'silk-blouse',
    name: 'Elegant Silk Blouse',
    brand: 'BELLEDONNE',
    category: 'women',
    subCategory: 'shirts',
    price: 5500,
    originalPrice: 5500,
    discount: 0,
    images: ['https://images.unsplash.com/photo-1588117305388-c2631a279f82?q=80&w=500'],
    colors: ['champagne', 'emerald', 'black'],
    sizes: ['XS', 'S', 'M', 'L'],
    description: 'Luxurious silk blouse with subtle drape detailing.',
    tags: ['clothing', 'women', 'blouse', 'silk', 'formal'],
    rating: 4.7,
    reviewCount: 92,
    inStock: true,
    isNew: true,
    isBestseller: false,
    createdAt: '2024-03-10T00:00:00Z'
  },
  {
    id: 'summer-dress',
    name: 'Floral Midi Dress',
    brand: 'BELLEDONNE',
    category: 'women',
    subCategory: 'dresses',
    price: 4800,
    originalPrice: 6000,
    discount: 20,
    images: ['https://images.unsplash.com/photo-1572804013309-8c98e16ea86d?q=80&w=500'],
    colors: ['yellow', 'blue'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    description: 'Lightweight midi dress featuring a vibrant floral print.',
    tags: ['clothing', 'women', 'dress', 'floral', 'summer'],
    rating: 4.8,
    reviewCount: 145,
    inStock: true,
    isNew: true,
    isBestseller: true,
    createdAt: '2024-04-01T00:00:00Z'
  },
  {
    id: 'high-waist-jeans',
    name: 'High-Waist Mom Jeans',
    brand: 'BELLEDONNE',
    category: 'women',
    subCategory: 'jeans',
    price: 3200,
    originalPrice: 4000,
    discount: 20,
    images: ['https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=500'],
    colors: ['light blue', 'dark blue', 'black'],
    sizes: ['26', '28', '30', '32', '34'],
    description: 'Classic high-waisted mom jeans in rigid denim.',
    tags: ['clothing', 'women', 'jeans', 'denim', 'casual'],
    rating: 4.6,
    reviewCount: 420,
    inStock: true,
    isNew: false,
    isBestseller: true,
    createdAt: '2023-01-20T00:00:00Z'
  },

  // TECH & KITCHEN
  {
    id: 'smart-blender',
    name: 'Pro Smart Blender',
    brand: 'BELLEDONNE Tech',
    category: 'tech-kitchen',
    subCategory: 'kitchen',
    price: 18500,
    originalPrice: 24000,
    discount: 23,
    images: ['https://images.unsplash.com/photo-1585237748805-728b75fba184?q=80&w=500'],
    colors: ['silver', 'black'],
    sizes: ['Standard'],
    description: 'High-speed professional blender with app connectivity and automated programs.',
    tags: ['kitchen', 'appliances', 'blender', 'smart'],
    rating: 4.9,
    reviewCount: 56,
    inStock: true,
    isNew: true,
    isBestseller: false,
    createdAt: '2024-05-10T00:00:00Z'
  },
  {
    id: 'noise-cancelling-headphones',
    name: 'Aura ANC Headphones',
    brand: 'BELLEDONNE Tech',
    category: 'tech-kitchen',
    subCategory: 'audio',
    price: 24999,
    originalPrice: 29999,
    discount: 16,
    images: ['https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?q=80&w=500'],
    colors: ['midnight blue', 'silver'],
    sizes: ['Standard'],
    description: 'Over-ear wireless headphones with industry-leading active noise cancellation.',
    tags: ['tech', 'audio', 'headphones', 'wireless'],
    rating: 4.8,
    reviewCount: 389,
    inStock: true,
    isNew: false,
    isBestseller: true,
    createdAt: '2023-10-05T00:00:00Z'
  },
  {
    id: 'smart-watch-pro',
    name: 'Infinity Smart Watch',
    brand: 'BELLEDONNE Tech',
    category: 'tech-kitchen',
    subCategory: 'wearables',
    price: 14500,
    originalPrice: 14500,
    discount: 0,
    images: ['https://images.unsplash.com/photo-1546868871-7041f2a55e12?q=80&w=500'],
    colors: ['rose gold', 'space grey'],
    sizes: ['40mm', '44mm'],
    description: 'Advanced smartwatch with ECG, fitness tracking, and cellular connectivity.',
    tags: ['tech', 'wearables', 'watch', 'fitness'],
    rating: 4.7,
    reviewCount: 178,
    inStock: true,
    isNew: true,
    isBestseller: true,
    createdAt: '2024-02-28T00:00:00Z'
  }
];

export const products = mockProducts;
