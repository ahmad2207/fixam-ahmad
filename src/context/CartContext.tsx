'use client';

import { createContext, useContext, useReducer, useCallback, useEffect } from 'react';

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
  variation?: string | null;
  stock: number;
}

interface CartState {
  items: CartItem[];
}

type CartAction =
  | { type: 'ADD_ITEM'; item: CartItem }
  | { type: 'REMOVE_ITEM'; productId: string; variation?: string | null }
  | { type: 'UPDATE_QUANTITY'; productId: string; variation?: string | null; quantity: number }
  | { type: 'CLEAR' }
  | { type: 'HYDRATE'; items: CartItem[] };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const key = `${action.item.productId}:${action.item.variation ?? ''}`;
      const existing = state.items.find(
        (i) => `${i.productId}:${i.variation ?? ''}` === key,
      );
      if (existing) {
        return {
          items: state.items.map((i) =>
            `${i.productId}:${i.variation ?? ''}` === key
              ? { ...i, quantity: Math.min(i.quantity + action.item.quantity, i.stock) }
              : i,
          ),
        };
      }
      return { items: [...state.items, action.item] };
    }
    case 'REMOVE_ITEM': {
      const key = `${action.productId}:${action.variation ?? ''}`;
      return { items: state.items.filter((i) => `${i.productId}:${i.variation ?? ''}` !== key) };
    }
    case 'UPDATE_QUANTITY': {
      const key = `${action.productId}:${action.variation ?? ''}`;
      if (action.quantity <= 0) {
        return { items: state.items.filter((i) => `${i.productId}:${i.variation ?? ''}` !== key) };
      }
      return {
        items: state.items.map((i) =>
          `${i.productId}:${i.variation ?? ''}` === key
            ? { ...i, quantity: Math.min(action.quantity, i.stock) }
            : i,
        ),
      };
    }
    case 'CLEAR':
      return { items: [] };
    case 'HYDRATE':
      return { items: action.items };
    default:
      return state;
  }
}

interface CartContextValue {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, variation?: string | null) => void;
  updateQuantity: (productId: string, quantity: number, variation?: string | null) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });

  // Load from localStorage after hydration to avoid server/client mismatch
  useEffect(() => {
    try {
      const saved = localStorage.getItem('fixam_cart');
      if (saved) {
        const parsed = JSON.parse(saved) as CartState;
        if (parsed?.items?.length) dispatch({ type: 'HYDRATE', items: parsed.items });
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('fixam_cart', JSON.stringify(state));
  }, [state]);

  const addItem = useCallback((item: CartItem) => dispatch({ type: 'ADD_ITEM', item }), []);
  const removeItem = useCallback(
    (productId: string, variation?: string | null) =>
      dispatch({ type: 'REMOVE_ITEM', productId, variation }),
    [],
  );
  const updateQuantity = useCallback(
    (productId: string, quantity: number, variation?: string | null) =>
      dispatch({ type: 'UPDATE_QUANTITY', productId, variation, quantity }),
    [],
  );
  const clearCart = useCallback(() => dispatch({ type: 'CLEAR' }), []);

  const itemCount = state.items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = state.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items: state.items, addItem, removeItem, updateQuantity, clearCart, itemCount, subtotal }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
