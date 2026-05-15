import { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Product, CartItem } from '../types';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<CartItem[]>(() => {
    const savedCart = localStorage.getItem('vibekart_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  // Sync with LocalStorage
  useEffect(() => {
    localStorage.setItem('vibekart_cart', JSON.stringify(cart));
  }, [cart]);

  // Sync with Backend for logged-in users
  useEffect(() => {
    if (!user) return;

    const fetchCart = async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch(`${BACKEND_URL}/get-cart/${user.uid}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const remoteCart = await res.json();
          if (remoteCart.length > 0) {
            setCart(remoteCart);
          }
        }
      } catch (err) {
        console.error('Failed to fetch remote cart:', err);
      }
    };

    fetchCart();
  }, [user?.uid]);

  const syncToBackend = useCallback(async (newCart: CartItem[]) => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${BACKEND_URL}/update-cart`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ uid: user.uid, items: newCart }),
      });
      if (!res.ok) throw new Error('Backend sync failed');
    } catch (err) {
      console.error('Failed to sync cart to backend:', err);
      toast.error('Cloud sync failed. Changes saved locally only.', { id: 'cart-sync-error' });
    }
  }, [user?.uid]);

  const addToCart = useCallback((product: Product) => {
    setCart((prevCart) => {
      let newCart;
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        newCart = prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        newCart = [...prevCart, { ...product, quantity: 1 }];
      }
      syncToBackend(newCart);
      return newCart;
    });
  }, [syncToBackend]);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prevCart) => {
      const newCart = prevCart.filter((item) => item.id !== productId);
      syncToBackend(newCart);
      return newCart;
    });
  }, [syncToBackend]);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prevCart) => {
      const newCart = prevCart.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      );
      syncToBackend(newCart);
      return newCart;
    });
  }, [removeFromCart, syncToBackend]);

  const clearCart = useCallback(() => {
    setCart([]);
    syncToBackend([]);
  }, [syncToBackend]);

  const cartTotal = useMemo(() => 
    cart.reduce((total, item) => total + item.price * item.quantity, 0),
  [cart]);

  const cartCount = useMemo(() => 
    cart.reduce((count, item) => count + item.quantity, 0),
  [cart]);

  const value = useMemo(() => ({
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartTotal,
    cartCount,
  }), [cart, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
