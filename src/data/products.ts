export interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  priceNum: number;
  image: string;
  className?: string;
  category: string;
  productType: 'footwear' | 'apparel' | 'electronics';
  gender?: 'Men' | 'Women' | 'Unisex';
  sizes: (string | number)[];
  colors: string[];
  brand?: string;
  searchTags?: string[];
}

export const products: Product[] = [
  // --- FOOTWEAR ---
  {
    id: 'b0-bsw',
    name: 'B0 BSW',
    description: 'Premium White Leather',
    price: '₹ 22,000',
    priceNum: 22000,
    image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=500',
    className: '',
    category: 'Sneakers',
    productType: 'footwear',
    gender: 'Men',
    sizes: [41, 42, 43],
    colors: ['#fff']
  },
  {
    id: 'b0-retro',
    name: 'B0 Retro',
    description: 'Vintage Gum Sole',
    price: '₹ 24,000',
    priceNum: 24000,
    image: 'https://images.unsplash.com/photo-1527010154944-f2241763d806?q=80&w=500',
    className: 'mt-12 md:mt-0 lg:mt-24',
    category: 'Sneakers',
    productType: 'footwear',
    gender: 'Unisex',
    sizes: [40, 42],
    colors: ['#c2b280', '#fff']
  },
  {
    id: 'b7-xx',
    name: 'B7 XX Women',
    description: 'Minimalist Runner',
    price: '₹ 26,000',
    priceNum: 26000,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=500',
    className: '',
    category: 'Sneakers',
    productType: 'footwear',
    gender: 'Women',
    sizes: [38, 39, 41],
    colors: ['#228b22', '#fff']
  },
  {
    id: 'b0-velcro',
    name: 'B0 Velcro',
    description: 'Triple Strap Detail',
    price: '₹ 23,000',
    priceNum: 23000,
    image: 'https://images.unsplash.com/photo-1603808033192-082d6919d3e1?q=80&w=500',
    className: '',
    category: 'Boots',
    productType: 'footwear',
    gender: 'Men',
    sizes: [40, 42, 45],
    colors: ['#fff']
  },
  {
    id: 'b0-classic-women',
    name: 'Classic Heels',
    description: 'Timeless Silhouette',
    price: '₹ 21,000',
    priceNum: 21000,
    image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=500',
    className: 'mt-12 md:mt-0 lg:mt-24',
    category: 'Heels',
    productType: 'footwear',
    gender: 'Women',
    sizes: [36, 37, 38],
    colors: ['#000', '#fff']
  },
  {
    id: 'b9-runner',
    name: 'B9 Runner',
    description: 'Technical Suede',
    price: '₹ 28,000',
    priceNum: 28000,
    image: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?q=80&w=500',
    className: '',
    category: 'Sneakers',
    productType: 'footwear',
    gender: 'Men',
    sizes: [42, 43, 44],
    colors: ['#000']
  },
  // --- FOOTWEAR PAGE 2 ---
  {
    id: 'b0-bsw-v2',
    name: 'B0 BSW (Alt)',
    description: 'Premium White Leather',
    price: '₹ 22,000',
    priceNum: 22000,
    image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=500',
    className: '',
    category: 'Sneakers',
    productType: 'footwear',
    gender: 'Men',
    sizes: [41, 42, 43],
    colors: ['#fff']
  },
  {
    id: 'b0-retro-v2',
    name: 'B0 Retro (Alt)',
    description: 'Vintage Gum Sole',
    price: '₹ 24,000',
    priceNum: 24000,
    image: 'https://images.unsplash.com/photo-1527010154944-f2241763d806?q=80&w=500',
    className: 'mt-12 md:mt-0 lg:mt-24',
    category: 'Sneakers',
    productType: 'footwear',
    gender: 'Unisex',
    sizes: [40, 42],
    colors: ['#c2b280', '#fff']
  },
  {
    id: 'b7-xx-v2',
    name: 'B7 XX Women (Alt)',
    description: 'Minimalist Runner',
    price: '₹ 26,000',
    priceNum: 26000,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=500',
    className: '',
    category: 'Sneakers',
    productType: 'footwear',
    gender: 'Women',
    sizes: [38, 39, 41],
    colors: ['#228b22', '#fff']
  },
  {
    id: 'b0-velcro-v2',
    name: 'B0 Velcro (Alt)',
    description: 'Triple Strap Detail',
    price: '₹ 23,000',
    priceNum: 23000,
    image: 'https://images.unsplash.com/photo-1603808033192-082d6919d3e1?q=80&w=500',
    className: '',
    category: 'Boots',
    productType: 'footwear',
    gender: 'Men',
    sizes: [40, 42, 45],
    colors: ['#fff']
  },
  {
    id: 'b0-classic-women-v2',
    name: 'Classic Heels (Alt)',
    description: 'Timeless Silhouette',
    price: '₹ 21,000',
    priceNum: 21000,
    image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=500',
    className: 'mt-12 md:mt-0 lg:mt-24',
    category: 'Heels',
    productType: 'footwear',
    gender: 'Women',
    sizes: [36, 37, 38],
    colors: ['#000', '#fff']
  },
  {
    id: 'b9-runner-v2',
    name: 'B9 Runner (Alt)',
    description: 'Technical Suede',
    price: '₹ 28,000',
    priceNum: 28000,
    image: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?q=80&w=500',
    className: '',
    category: 'Sneakers',
    productType: 'footwear',
    gender: 'Men',
    sizes: [42, 43, 44],
    colors: ['#000']
  },

  // --- APPAREL (Shirts, Pants, Innerwear) ---
  {
    id: 'shirt-oxford',
    name: 'Oxford Cotton Shirt',
    description: 'Classic Fit Button Down',
    price: '₹ 3,500',
    priceNum: 3500,
    image: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?q=80&w=500',
    className: '',
    category: 'Shirts',
    productType: 'apparel',
    gender: 'Men',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['#fff', '#000080']
  },
  {
    id: 'shirt-silk-women',
    name: 'Silk Blouse',
    description: 'Elegant Evening Wear',
    price: '₹ 6,000',
    priceNum: 6000,
    image: 'https://images.unsplash.com/photo-1598554747436-c9293d6a588f?q=80&w=500',
    className: 'mt-12 md:mt-0 lg:mt-24',
    category: 'Shirts',
    productType: 'apparel',
    gender: 'Women',
    sizes: ['XS', 'S', 'M'],
    colors: ['#fff']
  },
  {
    id: 'pant-chino',
    name: 'Slim Fit Chinos',
    description: 'Everyday Essential Pants',
    price: '₹ 4,200',
    priceNum: 4200,
    image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=500',
    className: '',
    category: 'Trousers',
    productType: 'apparel',
    gender: 'Men',
    sizes: ['S', 'M', 'L'],
    colors: ['#c2b280', '#000'],
    searchTags: ['pants', 'jeans', 'bottoms']
  },
  {
    id: 'pant-linen-women',
    name: 'Wide Leg Linen Pants',
    description: 'Breathable Summer Wear',
    price: '₹ 4,500',
    priceNum: 4500,
    image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=500',
    className: '',
    category: 'Trousers',
    productType: 'apparel',
    gender: 'Women',
    sizes: ['XS', 'S', 'M'],
    colors: ['#fff']
  },
  {
    id: 'inner-briefs',
    name: 'Cotton Stretch Briefs',
    description: 'Pack of 3',
    price: '₹ 1,500',
    priceNum: 1500,
    image: 'https://images.unsplash.com/photo-1563178406-4cdc2923acbc?q=80&w=500',
    className: 'mt-12 md:mt-0 lg:mt-24',
    category: 'Innerwear',
    productType: 'apparel',
    gender: 'Men',
    sizes: ['M', 'L', 'XL'],
    colors: ['#000', '#fff']
  },
  {
    id: 'inner-bra-women',
    name: 'Seamless Sports Bra',
    description: 'High Support',
    price: '₹ 2,200',
    priceNum: 2200,
    image: 'https://images.unsplash.com/photo-1620799140188-3b2a02fd9a77?q=80&w=500',
    className: '',
    category: 'Innerwear',
    productType: 'apparel',
    gender: 'Women',
    sizes: ['S', 'M', 'L'],
    colors: ['#228b22']
  },

  // --- ELECTRONICS & KITCHEN ---
  {
    id: 'elec-headphones',
    name: 'Noise Cancelling Over-Ear',
    description: 'Premium Audio Experience',
    price: '₹ 29,900',
    priceNum: 29900,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=500',
    className: '',
    category: 'Audio',
    productType: 'electronics',
    brand: 'Sony',
    sizes: [],
    colors: ['#000', '#fff']
  },
  {
    id: 'elec-phone',
    name: 'Pro Max Smartphone',
    description: 'Latest Tech Innovation',
    price: '₹ 1,20,000',
    priceNum: 120000,
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=500',
    className: 'mt-12 md:mt-0 lg:mt-24',
    category: 'Mobiles',
    productType: 'electronics',
    brand: 'Apple',
    sizes: [],
    colors: ['#000']
  },
  {
    id: 'kit-blender',
    name: 'High-Speed Blender',
    description: 'Professional Kitchen Tool',
    price: '₹ 15,500',
    priceNum: 15500,
    image: 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?q=80&w=500',
    className: '',
    category: 'Kitchen Items',
    productType: 'electronics',
    brand: 'Philips',
    sizes: [],
    colors: ['#fff'],
    searchTags: ['blender', 'cookware', 'utensils']
  },
  {
    id: 'kit-coffee',
    name: 'Espresso Machine',
    description: 'Barista Quality Coffee',
    price: '₹ 45,000',
    priceNum: 45000,
    image: 'https://images.unsplash.com/photo-1517686469429-8bdb88b9f907?q=80&w=500',
    className: '',
    category: 'Kitchen Items',
    productType: 'electronics',
    brand: 'Philips',
    sizes: [],
    colors: ['#fff'],
    searchTags: ['coffee', 'cookware', 'utensils']
  },
  {
    id: 'elec-watch',
    name: 'Smart Fitness Watch',
    description: 'Track your daily activity',
    price: '₹ 12,999',
    priceNum: 12999,
    image: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?q=80&w=500',
    className: '',
    category: 'Mobiles',
    productType: 'electronics',
    brand: 'Apple',
    sizes: [],
    colors: ['#000', '#fff'],
    searchTags: ['watch', 'smartwatch', 'fitness']
  }
];
