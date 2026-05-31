import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import {
  getWishlistAPI,
  addToWishlistAPI,
  removeFromWishlistAPI,
  clearWishlistAPI,
  mergeWishlistAPI
} from '../services/wishlistService';

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
  isLoading: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoggedIn, user } = useAuth();
  const { showToast } = useToast();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>(() => {
    const stored = localStorage.getItem('wishlist_items');
    return stored ? JSON.parse(stored) : [];
  });
  const [isLoading, setIsLoading] = useState(false);

  const mapBackendWishlist = (wishlist: any[]): WishlistItem[] => {
    if (!wishlist) return [];
    return wishlist.map(product => ({
      id: product.id,
      name: product.name,
      price: typeof product.price === 'string'
        ? parseInt((product.price as string).replace(/[^0-9]/g, ''))
        : product.price,
      image: product.image || ''
    }));
  };

  const fetchWishlist = async () => {
    if (!isLoggedIn || user?.role === 'ROLE_ADMIN') return;
    setIsLoading(true);
    try {
      const wishlist = await getWishlistAPI();
      setWishlistItems(mapBackendWishlist(wishlist));
    } catch (err) {
      console.error('Failed to fetch wishlist', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMergeWishlist = async () => {
    if (!isLoggedIn || user?.role === 'ROLE_ADMIN') return;
    const stored = localStorage.getItem('wishlist_items');
    if (!stored) {
      await fetchWishlist();
      return;
    }

    try {
      const localItems: WishlistItem[] = JSON.parse(stored);
      if (localItems.length > 0) {
        setIsLoading(true);
        const productIds = localItems.map(item => item.id);
        const mergedWishlist = await mergeWishlistAPI(productIds);
        setWishlistItems(mapBackendWishlist(mergedWishlist));
        localStorage.removeItem('wishlist_items');
        showToast('Your wishlist has been synchronized!', 'success');
      } else {
        await fetchWishlist();
      }
    } catch (err) {
      console.error('Failed to merge guest wishlist', err);
      showToast('Could not merge your guest wishlist.', 'error');
      await fetchWishlist();
    } finally {
      setIsLoading(false);
    }
  };

  // Synchronize on login state changes or when clean mount detects logged-in user
  useEffect(() => {
    if (isLoggedIn && user?.role !== 'ROLE_ADMIN') {
      handleMergeWishlist();
    } else if (!isLoggedIn) {
      // Clear localStorage items on logout so previous user data doesn't leak
      localStorage.removeItem('wishlist_items');
      setWishlistItems([]);
    }
  }, [isLoggedIn, user]);

  // Listen to custom belledonne:login event for explicit synchronization trigger
  useEffect(() => {
    const handleLoginEvent = () => {
      handleMergeWishlist();
    };
    window.addEventListener('belledonne:login', handleLoginEvent);
    return () => window.removeEventListener('belledonne:login', handleLoginEvent);
  }, [isLoggedIn, user]);

  // Store guest wishlist in localStorage
  useEffect(() => {
    if (!isLoggedIn || user?.role === 'ROLE_ADMIN') {
      localStorage.setItem('wishlist_items', JSON.stringify(wishlistItems));
    }
  }, [wishlistItems, isLoggedIn, user]);

  const addToWishlist = async (product: WishlistItem) => {
    if (isLoggedIn && user?.role !== 'ROLE_ADMIN') {
      const previousItems = [...wishlistItems];
      // Optimistic update
      setWishlistItems(prev => {
        if (!prev.some(item => item.id === product.id)) {
          return [...prev, product];
        }
        return prev;
      });

      try {
        await addToWishlistAPI(product.id);
        showToast('Product added to wishlist', 'success');
      } catch (err) {
        console.error('Failed to add to wishlist', err);
        showToast('Failed to add item to wishlist', 'error');
        setWishlistItems(previousItems);
      }
    } else {
      // Guest behavior
      setWishlistItems(prev => {
        if (!prev.some(item => item.id === product.id)) {
          return [...prev, product];
        }
        return prev;
      });
      showToast('Product added to guest wishlist', 'success');
    }
  };

  const removeFromWishlist = async (id: string) => {
    if (isLoggedIn && user?.role !== 'ROLE_ADMIN') {
      const previousItems = [...wishlistItems];
      // Optimistic update
      setWishlistItems(prev => prev.filter(item => item.id !== id));

      try {
        await removeFromWishlistAPI(id);
        showToast('Product removed from wishlist', 'info');
      } catch (err) {
        console.error('Failed to remove from wishlist', err);
        showToast('Failed to remove item from wishlist', 'error');
        setWishlistItems(previousItems);
      }
    } else {
      // Guest behavior
      setWishlistItems(prev => prev.filter(item => item.id !== id));
      showToast('Product removed from guest wishlist', 'info');
    }
  };

  const clearWishlist = async () => {
    if (isLoggedIn && user?.role !== 'ROLE_ADMIN') {
      const previousItems = [...wishlistItems];
      setWishlistItems([]);
      try {
        await clearWishlistAPI();
        showToast('Wishlist cleared', 'info');
      } catch (err) {
        console.error('Failed to clear wishlist', err);
        showToast('Failed to clear wishlist', 'error');
        setWishlistItems(previousItems);
      }
    } else {
      // Guest behavior
      setWishlistItems([]);
      showToast('Guest wishlist cleared', 'info');
    }
  };

  const wishlistCount = wishlistItems.length;

  const isInWishlist = (id: string) => {
    return wishlistItems.some(item => item.id === id);
  };

  return (
    <WishlistContext.Provider value={{
      wishlistItems, addToWishlist, removeFromWishlist, clearWishlist, wishlistCount, isInWishlist, isLoading
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
