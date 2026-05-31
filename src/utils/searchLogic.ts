import type { Product } from '../types/product';

export const synonymMap: Record<string, string[]> = {
  'shoes': ['sneakers', 'boots', 'heels', 'footwear', 'shoe'],
  'shoe': ['sneakers', 'boots', 'heels', 'footwear', 'shoes'],
  'footwear': ['sneakers', 'boots', 'heels', 'shoes'],
  'apparel': ['shirts', 'trousers', 'innerwear', 'clothes', 'pants', 't-shirts'],
  'clothes': ['shirts', 'trousers', 'innerwear', 'apparel', 'pants', 't-shirts'],
  'electronics': ['audio', 'mobiles', 'tech', 'kitchen items', 'kitchen'],
  'kitchen': ['kitchen items', 'blender', 'cookware', 'utensils', 'coffee'],
  'strits': ['shirts'], // Typo handling
  'tshirt': ['t-shirts', 'shirts'],
  'tshirts': ['t-shirts', 'shirts'],
  'pants': ['trousers', 'jeans', 'chinos', 'bottoms'],
  'jeans': ['trousers', 'pants', 'chinos', 'bottoms'],
  'bottoms': ['trousers', 'pants', 'chinos', 'jeans'],
  'sneaker': ['sneakers']
};

export const searchProducts = (query: string, allProducts: Product[]): Product[] => {
  if (!query || query.trim() === '') return [];

  const rawQuery = query.toLowerCase().trim();
  const searchTokens = rawQuery.split(/\s+/);
  
  // Expand tokens using synonym map
  const expandedTokens = searchTokens.reduce((acc: string[], token: string) => {
    acc.push(token);
    if (synonymMap[token]) {
      acc.push(...synonymMap[token]);
    }
    return acc;
  }, []);

  // Filter products
  return allProducts.filter(product => {
    const searchableString = [
      product.name.toLowerCase(),
      product.category.toLowerCase(),
      product.subCategory.toLowerCase(),
      ...(product.tags?.map((tag: string) => tag.toLowerCase()) || []),
      product.brand?.toLowerCase() || ''
    ].join(' ');

    // We want to match if ANY of the expanded tokens are found in the searchable string
    return expandedTokens.some(token => searchableString.includes(token));
  });
};
