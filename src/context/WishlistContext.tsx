import React, { createContext, useContext, useState, useEffect } from 'react';

import { useAuth } from './AuthContext';
import { getWishlistAPI, addToWishlistAPI, removeFromWishlistAPI, clearWishlistAPI } from '../services/wishlistService';

export interface WishlistItem {
  id: string;
  name: string;
  price: number;
  image: string;
}

interface WishlistContextType {
  wishlistItems: WishlistItem[];
  addToWishlist: (product: WishlistItem) => Promise<void>;
  removeFromWishlist: (id: string) => Promise<void>;
  clearWishlist: () => Promise<void>;
  wishlistCount: number;
  isInWishlist: (id: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoggedIn } = useAuth();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>(() => {
    const stored = localStorage.getItem('wishlist_items');
    return stored ? JSON.parse(stored) : [];
  });

  const fetchWishlist = async () => {
    if (!isLoggedIn) return;
    try {
      const wishlist = await getWishlistAPI();
      if (wishlist) {
        setWishlistItems(wishlist.map(product => ({
          id: product.id,
          name: product.name,
          price: typeof (product.price as any) === 'string' ? parseInt((product.price as any).replace(/[^0-9]/g, '')) : product.price,
          image: product.image || ''
        })));
      }
    } catch (err) {
      console.error('Failed to fetch wishlist', err);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchWishlist();
    } else {
      const stored = localStorage.getItem('wishlist_items');
      setWishlistItems(stored ? JSON.parse(stored) : []);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) {
      localStorage.setItem('wishlist_items', JSON.stringify(wishlistItems));
    }
  }, [wishlistItems, isLoggedIn]);

  const addToWishlist = async (product: WishlistItem) => {
    if (isLoggedIn) {
      try {
        await addToWishlistAPI(product.id);
        await fetchWishlist();
      } catch (err) {
        console.error('Failed to add to wishlist', err);
      }
    } else {
      setWishlistItems(prev => {
        if (!prev.some(item => item.id === product.id)) {
          return [...prev, product];
        }
        return prev;
      });
    }
  };

  const removeFromWishlist = async (id: string) => {
    if (isLoggedIn) {
      try {
        await removeFromWishlistAPI(id);
        await fetchWishlist();
      } catch (err) {
        console.error('Failed to remove from wishlist', err);
      }
    } else {
      setWishlistItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const clearWishlist = async () => {
    if (isLoggedIn) {
      try {
        await clearWishlistAPI();
        await fetchWishlist();
      } catch (err) {
        console.error('Failed to clear wishlist', err);
      }
    } else {
      setWishlistItems([]);
    }
  };

  const wishlistCount = wishlistItems.length;
  
  const isInWishlist = (id: string) => {
    return wishlistItems.some(item => item.id === id);
  };

  return (
    <WishlistContext.Provider value={{ 
      wishlistItems, addToWishlist, removeFromWishlist, clearWishlist, wishlistCount, isInWishlist 
    }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
