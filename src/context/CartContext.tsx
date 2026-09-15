'use client';

import { createContext, useContext, useReducer, useCallback, useEffect } from 'react';

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
  // Free-text display label, possibly flattening multiple variation groups
  // (e.g. "24cm / Blue") — shown on cart/receipts, and what dedup below
  // keys on. `variationOption` is the exact value of just the *priced*
  // group, used downstream for pricing/stock (see priceCheckoutItems).
  variation?: string | null;
  variationOption?: string | null;
  stock: number;
}

// A combo deal in the cart — several products bought together at one
// bundle price (not the sum of the parts). `maxQuantity` is how many
// bundles can actually be purchased right now (the smallest
// floor(component.stock / component.quantity) across its components),
// computed when the combo is added; quantity is capped to it the same way
// a regular CartItem's quantity is capped to `stock`.
export interface ComboCartItem {
  comboId: string;
  slug: string;
  name: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
  maxQuantity: number;
  components: { productId: string; name: string; quantity: number; imageUrl: string | null }[];
}

interface CartState {
  items: CartItem[];
  combos: ComboCartItem[];
}

type CartAction =
  | { type: 'ADD_ITEM'; item: CartItem }
  | { type: 'REMOVE_ITEM'; productId: string; variation?: string | null }
  | { type: 'UPDATE_QUANTITY'; productId: string; variation?: string | null; quantity: number }
  | { type: 'ADD_COMBO'; combo: ComboCartItem }
  | { type: 'REMOVE_COMBO'; comboId: string }
  | { type: 'UPDATE_COMBO_QUANTITY'; comboId: string; quantity: number }
  | { type: 'CLEAR' }
  | { type: 'HYDRATE'; items: CartItem[]; combos: ComboCartItem[] };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const key = `${action.item.productId}:${action.item.variation ?? ''}`;
      const existing = state.items.find(
        (i) => `${i.productId}:${i.variation ?? ''}` === key,
      );
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            `${i.productId}:${i.variation ?? ''}` === key
              ? { ...i, quantity: Math.min(i.quantity + action.item.quantity, i.stock) }
              : i,
          ),
        };
      }
      return { ...state, items: [...state.items, action.item] };
    }
    case 'REMOVE_ITEM': {
      const key = `${action.productId}:${action.variation ?? ''}`;
      return { ...state, items: state.items.filter((i) => `${i.productId}:${i.variation ?? ''}` !== key) };
    }
    case 'UPDATE_QUANTITY': {
      const key = `${action.productId}:${action.variation ?? ''}`;
      if (action.quantity <= 0) {
        return { ...state, items: state.items.filter((i) => `${i.productId}:${i.variation ?? ''}` !== key) };
      }
      return {
        ...state,
        items: state.items.map((i) =>
          `${i.productId}:${i.variation ?? ''}` === key
            ? { ...i, quantity: Math.min(action.quantity, i.stock) }
            : i,
        ),
      };
    }
    case 'ADD_COMBO': {
      const existing = state.combos.find((c) => c.comboId === action.combo.comboId);
      if (existing) {
        return {
          ...state,
          combos: state.combos.map((c) =>
            c.comboId === action.combo.comboId
              ? { ...c, quantity: Math.min(c.quantity + action.combo.quantity, c.maxQuantity) }
              : c,
          ),
        };
      }
      return { ...state, combos: [...state.combos, action.combo] };
    }
    case 'REMOVE_COMBO':
      return { ...state, combos: state.combos.filter((c) => c.comboId !== action.comboId) };
    case 'UPDATE_COMBO_QUANTITY': {
      if (action.quantity <= 0) {
        return { ...state, combos: state.combos.filter((c) => c.comboId !== action.comboId) };
      }
      return {
        ...state,
        combos: state.combos.map((c) =>
          c.comboId === action.comboId ? { ...c, quantity: Math.min(action.quantity, c.maxQuantity) } : c,
        ),
      };
    }
    case 'CLEAR':
      return { items: [], combos: [] };
    case 'HYDRATE':
      return { items: action.items, combos: action.combos };
    default:
      return state;
  }
}

interface CartContextValue {
  items: CartItem[];
  combos: ComboCartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, variation?: string | null) => void;
  updateQuantity: (productId: string, quantity: number, variation?: string | null) => void;
  addCombo: (combo: ComboCartItem) => void;
  removeCombo: (comboId: string) => void;
  updateComboQuantity: (comboId: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], combos: [] });

  // Load from localStorage after hydration to avoid server/client mismatch
  useEffect(() => {
    try {
      const saved = localStorage.getItem('fixam_cart');
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<CartState>;
        if (parsed?.items?.length || parsed?.combos?.length) {
          dispatch({ type: 'HYDRATE', items: parsed.items ?? [], combos: parsed.combos ?? [] });
        }
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
  const addCombo = useCallback((combo: ComboCartItem) => dispatch({ type: 'ADD_COMBO', combo }), []);
  const removeCombo = useCallback((comboId: string) => dispatch({ type: 'REMOVE_COMBO', comboId }), []);
  const updateComboQuantity = useCallback(
    (comboId: string, quantity: number) => dispatch({ type: 'UPDATE_COMBO_QUANTITY', comboId, quantity }),
    [],
  );
  const clearCart = useCallback(() => dispatch({ type: 'CLEAR' }), []);

  const itemCount =
    state.items.reduce((sum, i) => sum + i.quantity, 0) +
    state.combos.reduce((sum, c) => sum + c.quantity, 0);
  const subtotal =
    state.items.reduce((sum, i) => sum + i.price * i.quantity, 0) +
    state.combos.reduce((sum, c) => sum + c.price * c.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        combos: state.combos,
        addItem,
        removeItem,
        updateQuantity,
        addCombo,
        removeCombo,
        updateComboQuantity,
        clearCart,
        itemCount,
        subtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
