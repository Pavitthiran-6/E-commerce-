import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import BlinkitProductCard from '../components/blinkit/BlinkitProductCard';
import type { Product } from '../types/product';

export default function Wishlist() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const { wishlistItems, removeFromWishlist } = useWishlist();
  const { showToast } = useToast();

  // Convert wishlist items to Product-compatible shape for BlinkitProductCard
  const wishlistAsProducts: Product[] = wishlistItems.map((item) => ({
    id: item.id,
    name: item.name,
    price: typeof item.price === 'number' ? item.price : parseInt(String(item.price).replace(/[^0-9]/g, '')),
    image: item.image,
    images: [item.image],
    brand: '',
    category: '',
    subCategory: '',
    originalPrice: typeof item.price === 'number' ? item.price : parseInt(String(item.price).replace(/[^0-9]/g, '')),
    discount: 0,
    colors: [],
    sizes: [],
    description: '',
    tags: [],
    rating: 0,
    reviewCount: 0,
    inStock: true,
    isNew: false,
    isBestseller: false,
    createdAt: '',
  }));

  if (wishlistItems.length === 0) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-20 bg-[#F8F8F8]">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-5">
          <Heart className="w-10 h-10 text-red-300" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Your Wishlist is Empty</h1>
        <p className="text-sm text-gray-500 text-center mb-6 max-w-xs">
          Save items you love and find them easily later!
        </p>
        <Link
          to="/collection"
          className="bg-[#0C831F] text-white font-bold px-8 py-3 rounded-xl hover:bg-[#0A6B19] transition-colors"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#F8F8F8] min-h-screen pb-20 md:pb-8">
      <div className="max-w-[1440px] mx-auto px-3 md:px-6 lg:px-10 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-900">
            My Wishlist
            <span className="text-sm font-medium text-gray-500 ml-2">({wishlistItems.length} items)</span>
          </h1>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
          {wishlistAsProducts.map((product) => (
            <BlinkitProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}
