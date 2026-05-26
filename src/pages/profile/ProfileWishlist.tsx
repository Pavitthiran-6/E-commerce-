import React from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';

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

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
        {wishlistItems.map((product) => (
          <div key={product.id} className="group cursor-pointer flex flex-col h-full bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300">
            <div className="relative aspect-[3/4] bg-[#f6f5f0] overflow-hidden">
              <img 
                src={product.image} 
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 mix-blend-multiply p-4"
              />
              <button 
                onClick={() => removeFromWishlist(product.id)}
                className="absolute top-4 right-4 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-red-500 hover:scale-110 transition-transform shadow-sm"
                title="Remove from wishlist"
              >
                <Heart className="w-4 h-4 fill-red-500" />
              </button>
            </div>
            <div className="p-4 flex flex-col flex-grow">
              <h3 className="font-serif text-lg text-charcoal-stone group-hover:text-primary transition-colors">{product.name}</h3>
              <p className="text-base font-bold tracking-wide text-charcoal-stone mt-1 mb-4">{typeof product.price === 'number' ? `₹${product.price.toLocaleString('en-IN')}` : product.price}</p>
              
              <button 
                onClick={() => handleAddToCart(product)}
                className="mt-auto w-full bg-white border border-primary text-primary px-4 py-2.5 rounded text-sm font-medium hover:bg-primary hover:text-white transition-colors"
              >
                Add to Cart
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
