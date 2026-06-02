import React from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import BlinkitProductCard from '../../components/blinkit/BlinkitProductCard';
import type { Product as ProductType } from '../../types/product';

export default function ProfileWishlist() {
  const { wishlistItems, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const handleAddToCart = (product: any) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: typeof product.price === 'string' 
        ? parseInt(product.price.replace(/[^0-9]/g, '')) 
        : product.price,
      image: product.image,
      quantity: 1,
      size: '8',
      color: 'Default'
    });
    showToast(`${product.name} added to cart!`, 'success', { label: 'View Cart', href: '/cart' });
  };

  if (wishlistItems.length === 0) {
    return (
      <div className="bg-white p-8 border border-outline-variant/30 rounded-xl flex flex-col items-center justify-center text-center min-h-[400px]">
        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 text-red-300">
          <Heart className="w-10 h-10" />
        </div>
        <h3 className="font-headline-md text-xl mb-2">Your wishlist is empty</h3>
        <p className="text-gray-500 text-sm mb-8 max-w-sm">
          Save items you love to your wishlist and easily find them later!
        </p>
        <Link 
          to="/collection"
          className="bg-primary text-white px-8 py-3 rounded-lg font-medium hover:bg-charcoal-stone transition-colors"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center mb-2">
        <h2 className="font-headline-md text-2xl">My Wishlist</h2>
        <span className="text-sm font-medium text-gray-500">{wishlistItems.length} items</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {wishlistItems.map((item) => {
          const product: ProductType = {
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
          };
          return <BlinkitProductCard key={product.id} product={product} />;
        })}
      </div>
    </div>
  );
}
