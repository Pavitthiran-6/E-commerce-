import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import type { Product } from '../../types/product';

interface BlinkitProductCardProps {
  product: Product;
  className?: string;
}

export default function BlinkitProductCard({ product, className = '' }: BlinkitProductCardProps) {
  const { cartItems, addToCart, updateQuantity } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const [isAdding, setIsAdding] = useState(false);

  // Find if this product is in cart
  const cartItem = cartItems.find(
    (item) => item.id === product.id
  );
  const quantity = cartItem?.quantity || 0;

  const price = typeof product.price === 'number' ? product.price : parseInt(String(product.price).replace(/[^0-9]/g, ''));
  const originalPrice = product.originalPrice || null;
  const discountPct = product.discountPercentage || product.discount || 0;

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAdding(true);
    addToCart({
      id: product.id,
      name: product.name,
      price,
      image: product.image || (product.images?.[0]) || '',
      quantity: 1,
      size: product.sizes?.[0] || 'Standard',
      color: product.colors?.[0] || 'Standard',
    });
    setTimeout(() => setIsAdding(false), 300);
  };

  const handleIncrease = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (cartItem) updateQuantity(cartItem.id, cartItem.size, cartItem.color, 1);
  };

  const handleDecrease = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (cartItem) updateQuantity(cartItem.id, cartItem.size, cartItem.color, -1);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist({
        id: product.id,
        name: product.name,
        price,
        image: product.image || (product.images?.[0]) || '',
      });
    }
  };

  return (
    <Link
      to={`/product/${product.id}`}
      className={`block bg-white rounded-xl overflow-hidden border border-[#E8E8E8] hover:shadow-md transition-shadow duration-200 group ${className}`}
    >
      {/* Image container */}
      <div className="relative bg-gray-50 aspect-square overflow-hidden">
        <img
          src={product.image || product.images?.[0] || ''}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          decoding="async"
        />

        {/* Discount badge */}
        {discountPct > 0 && (
          <span className="absolute top-2 left-2 bg-[#E53935] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md leading-none">
            {Math.round(discountPct)}% OFF
          </span>
        )}

        {/* Wishlist button */}
        <button
          onClick={handleWishlist}
          className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center bg-white/90 rounded-full shadow-sm hover:scale-110 transition-transform z-10"
          aria-label={isInWishlist(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill={isInWishlist(product.id) ? '#E53935' : 'none'}
            stroke={isInWishlist(product.id) ? '#E53935' : '#666666'}
            strokeWidth={2}
            className="w-4 h-4"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
          </svg>
        </button>
      </div>

      {/* Info section */}
      <div className="p-2.5">
        {/* Product name */}
        <p className="text-xs text-gray-800 font-medium line-clamp-2 leading-snug mb-1 min-h-[2.5rem]">
          {product.name}
        </p>

        {/* Price row */}
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-sm font-bold text-gray-900">
            ₹{price.toLocaleString('en-IN')}
          </span>
          {originalPrice && originalPrice > price && (
            <span className="text-xs text-gray-400 line-through">
              ₹{originalPrice.toLocaleString('en-IN')}
            </span>
          )}
        </div>

        {/* Add / Stepper button */}
        <div className="flex justify-end">
          {quantity === 0 ? (
            <button
              onClick={handleAdd}
              className={`flex items-center gap-1 bg-white border-2 border-[#0C831F] text-[#0C831F] text-xs font-bold px-3 py-1 rounded-lg hover:bg-[#0C831F] hover:text-white transition-all duration-150 active:scale-95 ${
                isAdding ? 'animate-blinkit-pulse bg-[#0C831F] text-white' : ''
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
              </svg>
              Add
            </button>
          ) : (
            <div className="flex items-center gap-0 bg-[#0C831F] rounded-lg overflow-hidden">
              <button
                onClick={handleDecrease}
                className="w-7 h-7 flex items-center justify-center text-white hover:bg-[#0A6B19] transition-colors active:scale-95"
                aria-label="Decrease quantity"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                  <path fillRule="evenodd" d="M4 10a.75.75 0 0 1 .75-.75h10.5a.75.75 0 0 1 0 1.5H4.75A.75.75 0 0 1 4 10Z" clipRule="evenodd" />
                </svg>
              </button>
              <span className="w-7 text-center text-xs font-bold text-white select-none">
                {quantity}
              </span>
              <button
                onClick={handleIncrease}
                className="w-7 h-7 flex items-center justify-center text-white hover:bg-[#0A6B19] transition-colors active:scale-95"
                aria-label="Increase quantity"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                  <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
