'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Product } from '../../types/product';
import { cartApi } from '../lib/api/cart';
import { useAuth } from '../components/contexts/AuthContext'; // Add this import

interface CartItem {
  product: Product;
  quantity: number;
  _id?: string;
  addedAt?: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  totalItems: number;
  totalPrice: number;
  loading: boolean;
  isAuthenticated: boolean;
  loginRequired: () => void;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { user, loginRequired: authLoginRequired } = useAuth(); // Get auth context
  
  // Derive isAuthenticated from auth context
  const isAuthenticated = !!user;

  // Load cart when authentication state changes
  useEffect(() => {
    if (isAuthenticated) {
      loadCartFromBackend();
    } else {
      // Clear cart if not authenticated
      setCart([]);
    }
  }, [isAuthenticated]);

  const loginRequired = () => {
    if (typeof window !== 'undefined') {
      authLoginRequired?.(); // Use auth context's loginRequired if available
    }
  };

  const loadCartFromBackend = async () => {
    if (!isAuthenticated) {
      setCart([]);
      return;
    }

    try {
      setLoading(true);
      const data = await cartApi.getCart();
      
      if (data && Array.isArray(data)) {
        const validData = data.filter(item => item && item.product);
        setCart(validData);
      }
    } catch (error) {
      console.error('Failed to load cart from backend:', error);
      setCart([]);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (product: Product, quantity: number) => {
    // Check authentication first
    if (!isAuthenticated) {
      loginRequired();
      return;
    }

    // Validate product ID
    const productId = product._id || product.id;
    if (!productId) {
      console.error('Cannot add product without ID to cart');
      return;
    }

    try {
      // Authenticated user - update backend
      const response = await cartApi.addItem(productId, quantity);
      
      if (response) {
        await loadCartFromBackend();
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const removeFromCart = async (productId: string) => {
    // Check authentication first
    if (!isAuthenticated) {
      loginRequired();
      return;
    }

    try {
      // Authenticated user
      await cartApi.removeItem(productId);
      await loadCartFromBackend();
    } catch (error) {
      console.error('Error removing from cart:', error);
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    // Check authentication first
    if (!isAuthenticated) {
      loginRequired();
      return;
    }

    if (quantity < 1) return;
    
    try {
      // Authenticated user
      await cartApi.updateItem(productId, quantity);
      await loadCartFromBackend();
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const clearCart = async () => {
    // Check authentication first
    if (!isAuthenticated) {
      loginRequired();
      return;
    }

    try {
      // Authenticated user
      await cartApi.clearCart();
      await loadCartFromBackend();
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  const refreshCart = async () => {
    if (isAuthenticated) {
      await loadCartFromBackend();
    }
  };

  // Safe calculation of totals with null checks
  const totalItems = cart.reduce((total, item) => {
    return total + (item?.quantity || 0);
  }, 0);
  
  const totalPrice = cart.reduce((total, item) => {
    const price = item?.product?.price || 0;
    const quantity = item?.quantity || 0;
    return total + (price * quantity);
  }, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        loading,
        isAuthenticated,
        loginRequired,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};