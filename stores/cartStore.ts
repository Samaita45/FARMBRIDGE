import { create } from 'zustand';

import type { MarketProduct } from '@/types';

export interface CartItem {
  product: MarketProduct;
  quantity: number;
}

export interface CartState {
  items: CartItem[];
  addItem: (product: MarketProduct, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalUSD: () => number;
  getTotalZWG: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  addItem: (product, quantity = 1) =>
    set((state) => {
      const existing = state.items.find((i) => i.product.id === product.id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.product.id === product.id
              ? { ...i, quantity: i.quantity + quantity }
              : i
          ),
        };
      }
      return { items: [...state.items, { product, quantity }] };
    }),
  removeItem: (productId) =>
    set((state) => ({
      items: state.items.filter((i) => i.product.id !== productId),
    })),
  updateQuantity: (productId, quantity) =>
    set((state) => ({
      items:
        quantity <= 0
          ? state.items.filter((i) => i.product.id !== productId)
          : state.items.map((i) =>
              i.product.id === productId ? { ...i, quantity } : i
            ),
    })),
  clearCart: () => set({ items: [] }),
  getTotalUSD: () =>
    get().items.reduce((sum, i) => sum + i.product.priceUSD * i.quantity, 0),
  getTotalZWG: () =>
    get().items.reduce((sum, i) => sum + i.product.priceZWG * i.quantity, 0),
  getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
}));
