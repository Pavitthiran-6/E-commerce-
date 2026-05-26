import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getCart, addToCartAPI, updateCartItemAPI, removeCartItemAPI, clearCartAPI } from '../services/cartService';

export interface CartItem {
  id: string;
  backendId?: number;
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
  updateQuantity: (id: string, size?: string, color?: string, quantity?: number) => Promise<void>;
  clearCart: () => Promise<void>;
  cartCount: number;
  cartTotal: number;
  isInCart: (id: string, size?: string, color?: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoggedIn } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    const stored = localStorage.getItem('cart_items');
    return stored ? JSON.parse(stored) : [];
  });

  const fetchCart = async () => {
    if (!isLoggedIn) return;
    try {
      const cart = await getCart();
      if (cart && cart.items) {
        setCartItems(cart.items.map(item => ({
          id: item.productId,
          backendId: item.id,
          name: item.productName,
          price: item.unitPrice,
          image: item.productImage,
          size: item.size,
          color: item.color,
          quantity: item.quantity
        })));
      }
    } catch (err) {
      console.error('Failed to fetch cart', err);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchCart();
    } else {
      const stored = localStorage.getItem('cart_items');
      setCartItems(stored ? JSON.parse(stored) : []);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) {
      localStorage.setItem('cart_items', JSON.stringify(cartItems));
    }
  }, [cartItems, isLoggedIn]);

  const addToCart = async (product: CartItem) => {
    if (isLoggedIn) {
      try {
        await addToCartAPI(product.id, product.quantity);
        await fetchCart();
      } catch (err) {
        console.error('Failed to add to cart', err);
      }
    } else {
      setCartItems(prev => {
        const existing = prev.find(item => 
          item.id === product.id && 
          (product.size ? item.size === product.size : true) && 
          (product.color ? item.color === product.color : true)
        );
        if (existing) {
          return prev.map(item => 
            item.id === product.id && 
            (product.size ? item.size === product.size : true) && 
            (product.color ? item.color === product.color : true)
              ? { ...item, quantity: item.quantity + product.quantity }
              : item
          );
        }
        return [...prev, product];
      });
    }
  };

  const removeFromCart = async (id: string, size?: string, color?: string) => {
    if (isLoggedIn) {
      const itemToRemove = cartItems.find(item => {
        if (size && color) return item.id === id && item.size === size && item.color === color;
        return item.id === id;
      });
      if (itemToRemove && itemToRemove.backendId) {
        try {
          await removeCartItemAPI(itemToRemove.backendId.toString());
          await fetchCart();
        } catch (err) {
          console.error('Failed to remove from cart', err);
        }
      }
    } else {
      setCartItems(prev => prev.filter(item => {
        if (size && color) return !(item.id === id && item.size === size && item.color === color);
        return item.id !== id;
      }));
    }
  };

  const updateQuantity = async (id: string, size?: string, color?: string, quantity?: number) => {
    const actualQuantity = typeof size === 'number' ? size : quantity;
    const actualSize = typeof size === 'number' ? undefined : size;
    const actualColor = color;

    if (actualQuantity !== undefined && actualQuantity <= 0) {
      await removeFromCart(id, actualSize, actualColor);
      return;
    }

    if (isLoggedIn) {
      const itemToUpdate = cartItems.find(item => {
        const match = actualSize && actualColor 
          ? (item.id === id && item.size === actualSize && item.color === actualColor)
          : (item.id === id);
        return match;
      });
      if (itemToUpdate && itemToUpdate.backendId && actualQuantity !== undefined) {
        try {
          await updateCartItemAPI(itemToUpdate.backendId.toString(), actualQuantity);
          await fetchCart();
        } catch (err) {
          console.error('Failed to update quantity', err);
        }
      }
    } else {
      setCartItems(prev => prev.map(item => {
        const match = actualSize && actualColor 
          ? (item.id === id && item.size === actualSize && item.color === actualColor)
          : (item.id === id);
        return match ? { ...item, quantity: actualQuantity as number } : item;
      }));
    }
  };

  const clearCart = async () => {
    if (isLoggedIn) {
      try {
        await clearCartAPI();
        await fetchCart();
      } catch (err) {
        console.error('Failed to clear cart', err);
      }
    } else {
      setCartItems([]);
    }
  };

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  
  const isInCart = (id: string, size?: string, color?: string) => {
    return cartItems.some(item => {
      if (size && color) return item.id === id && item.size === size && item.color === color;
      return item.id === id;
    });
  };

  return (
    <CartContext.Provider value={{ 
      cartItems, addToCart, removeFromCart, updateQuantity, clearCart, cartCount, cartTotal, isInCart 
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
