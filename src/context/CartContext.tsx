import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import {
  getCart,
  addToCartAPI,
  updateCartItemAPI,
  removeCartItemAPI,
  clearCartAPI,
  mergeCartAPI
} from '../services/cartService';

export interface CartItem {
  id: string; // Product UUID string
  backendId?: number; // DB primary key
  name: string;
  price: number;
  image: string;
  size: string;
  color: string;
  quantity: number;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: CartItem) => Promise<void>;
  removeFromCart: (id: string, size?: string, color?: string) => Promise<void>;
  updateQuantity: (id: string, size?: string | number, color?: string, quantity?: number) => Promise<void>;
  clearCart: () => Promise<void>;
  cartCount: number;
  cartTotal: number;
  isInCart: (id: string, size?: string, color?: string) => boolean;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoggedIn, user } = useAuth();
  const { showToast } = useToast();
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    const stored = localStorage.getItem('cart_items');
    return stored ? JSON.parse(stored) : [];
  });
  const [isLoading, setIsLoading] = useState(false);

  const mapBackendCart = (backendCart: any): CartItem[] => {
    if (!backendCart || !backendCart.items) return [];
    return backendCart.items.map((item: any) => ({
      id: item.productId,
      backendId: item.id,
      name: item.productName,
      price: item.unitPrice,
      image: item.productImage,
      size: item.size || '',
      color: item.color || '',
      quantity: item.quantity
    }));
  };

  const fetchCart = async () => {
    if (!isLoggedIn || user?.role === 'ROLE_ADMIN') return;
    setIsLoading(true);
    try {
      const cart = await getCart();
      setCartItems(mapBackendCart(cart));
    } catch (err) {
      console.error('Failed to fetch cart', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMergeCart = async () => {
    if (!isLoggedIn || user?.role === 'ROLE_ADMIN') return;
    const stored = localStorage.getItem('cart_items');
    if (!stored) {
      await fetchCart();
      return;
    }

    try {
      const localItems: CartItem[] = JSON.parse(stored);
      if (localItems.length > 0) {
        setIsLoading(true);
        const mergeInput = localItems.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          size: item.size || undefined,
          color: item.color || undefined
        }));
        const mergedCart = await mergeCartAPI(mergeInput);
        setCartItems(mapBackendCart(mergedCart));
        localStorage.removeItem('cart_items');
        showToast('Your shopping cart has been synchronized!', 'success');
      } else {
        await fetchCart();
      }
    } catch (err) {
      console.error('Failed to merge guest cart', err);
      showToast('Could not merge your guest cart.', 'error');
      await fetchCart();
    } finally {
      setIsLoading(false);
    }
  };

  // Synchronize on login state changes or when clean mount detects logged-in user
  useEffect(() => {
    if (isLoggedIn && user?.role !== 'ROLE_ADMIN') {
      handleMergeCart();
    } else if (!isLoggedIn) {
      // Clear localStorage items on logout so previous user data doesn't leak
      localStorage.removeItem('cart_items');
      setCartItems([]);
    }
  }, [isLoggedIn, user]);

  // Listen to custom belledonne:login event for explicit synchronization trigger
  useEffect(() => {
    const handleLoginEvent = () => {
      handleMergeCart();
    };
    window.addEventListener('belledonne:login', handleLoginEvent);
    return () => window.removeEventListener('belledonne:login', handleLoginEvent);
  }, [isLoggedIn, user]);

  // Store guest cart in localStorage
  useEffect(() => {
    if (!isLoggedIn || user?.role === 'ROLE_ADMIN') {
      localStorage.setItem('cart_items', JSON.stringify(cartItems));
    }
  }, [cartItems, isLoggedIn, user]);

  const addToCart = async (product: CartItem) => {
    const targetItemMatcher = (item: CartItem) =>
      item.id === product.id &&
      item.size === product.size &&
      item.color === product.color;

    if (isLoggedIn && user?.role !== 'ROLE_ADMIN') {
      const previousItems = [...cartItems];
      // Optimistic state update
      setCartItems(prev => {
        const existingIndex = prev.findIndex(targetItemMatcher);
        if (existingIndex > -1) {
          const next = [...prev];
          next[existingIndex] = {
            ...next[existingIndex],
            quantity: next[existingIndex].quantity + product.quantity
          };
          return next;
        }
        return [...prev, product];
      });

      try {
        const updatedCart = await addToCartAPI(
          product.id,
          product.quantity,
          product.size || undefined,
          product.color || undefined
        );
        setCartItems(mapBackendCart(updatedCart));
        showToast('Item added to cart', 'success');
      } catch (err) {
        console.error('Failed to add to cart', err);
        showToast('Failed to add item to cart', 'error');
        setCartItems(previousItems);
      }
    } else {
      // Guest behavior
      setCartItems(prev => {
        const existingIndex = prev.findIndex(targetItemMatcher);
        if (existingIndex > -1) {
          const next = [...prev];
          next[existingIndex] = {
            ...next[existingIndex],
            quantity: next[existingIndex].quantity + product.quantity
          };
          return next;
        }
        return [...prev, product];
      });
      showToast('Item added to guest cart', 'success');
    }
  };

  const removeFromCart = async (id: string, size?: string, color?: string) => {
    const itemMatcher = (item: CartItem) =>
      item.id === id &&
      (size !== undefined ? item.size === size : true) &&
      (color !== undefined ? item.color === color : true);

    if (isLoggedIn && user?.role !== 'ROLE_ADMIN') {
      const itemToRemove = cartItems.find(itemMatcher);

      if (itemToRemove && itemToRemove.backendId) {
        const previousItems = [...cartItems];
        // Optimistic state update
        setCartItems(prev => prev.filter(item => item.backendId !== itemToRemove.backendId));

        try {
          const updatedCart = await removeCartItemAPI(itemToRemove.backendId.toString());
          setCartItems(mapBackendCart(updatedCart));
          showToast('Item removed from cart', 'info');
        } catch (err) {
          console.error('Failed to remove from cart', err);
          showToast('Failed to remove item', 'error');
          setCartItems(previousItems);
        }
      }
    } else {
      // Guest behavior
      setCartItems(prev => prev.filter(item => !itemMatcher(item)));
      showToast('Item removed from guest cart', 'info');
    }
  };

  const updateQuantity = async (id: string, size?: string | number, color?: string, quantity?: number) => {
    // Resolve overloaded parameters
    const actualQuantity = typeof size === 'number' ? size : quantity;
    const actualSize = typeof size === 'number' ? undefined : size;
    const actualColor = color;

    if (actualQuantity !== undefined && actualQuantity <= 0) {
      await removeFromCart(id, actualSize, actualColor);
      return;
    }

    const itemMatcher = (item: CartItem) =>
      item.id === id &&
      (actualSize !== undefined ? item.size === actualSize : true) &&
      (actualColor !== undefined ? item.color === actualColor : true);

    if (isLoggedIn && user?.role !== 'ROLE_ADMIN') {
      const itemToUpdate = cartItems.find(itemMatcher);

      if (itemToUpdate && itemToUpdate.backendId && actualQuantity !== undefined) {
        const previousItems = [...cartItems];
        // Optimistic state update
        setCartItems(prev => prev.map(item =>
          item.backendId === itemToUpdate.backendId
            ? { ...item, quantity: actualQuantity }
            : item
        ));

        try {
          const updatedCart = await updateCartItemAPI(itemToUpdate.backendId.toString(), actualQuantity);
          setCartItems(mapBackendCart(updatedCart));
        } catch (err) {
          console.error('Failed to update quantity', err);
          showToast('Failed to update quantity', 'error');
          setCartItems(previousItems);
        }
      }
    } else {
      // Guest behavior
      setCartItems(prev => prev.map(item => {
        const match = itemMatcher(item);
        return match ? { ...item, quantity: actualQuantity as number } : item;
      }));
    }
  };

  const clearCart = async () => {
    if (isLoggedIn && user?.role !== 'ROLE_ADMIN') {
      const previousItems = [...cartItems];
      setCartItems([]);
      try {
        await clearCartAPI();
        showToast('Cart cleared', 'info');
      } catch (err) {
        console.error('Failed to clear cart', err);
        showToast('Failed to clear cart', 'error');
        setCartItems(previousItems);
      }
    } else {
      // Guest behavior
      setCartItems([]);
      showToast('Guest cart cleared', 'info');
    }
  };

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const isInCart = (id: string, size?: string, color?: string) => {
    return cartItems.some(item =>
      item.id === id &&
      (size !== undefined ? item.size === size : true) &&
      (color !== undefined ? item.color === color : true)
    );
  };

  return (
    <CartContext.Provider value={{
      cartItems, addToCart, removeFromCart, updateQuantity, clearCart, cartCount, cartTotal, isInCart, isLoading
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
