import { create } from 'zustand';
import { CartItem, MenuItem } from '@/types';

interface CartState {
  items: CartItem[];
  isCartOpen: boolean;
  addToCart: (menu: MenuItem, qty?: number, notes?: string) => void;
  removeFromCart: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  updateNotes: (id: string, notes: string) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
}

export const useCart = create<CartState>((set, get) => ({
  items: [],
  isCartOpen: false,
  
  addToCart: (menu, qty = 1, notes = "") => {
    set((state) => {
      const existingItem = state.items.find(item => item.id === menu.id);
      if (existingItem) {
        return {
          items: state.items.map(item => 
            item.id === menu.id 
              ? { ...item, qty: item.qty + qty, notes: notes || item.notes } 
              : item
          ),
          isCartOpen: true // Auto open cart when item added
        };
      }
      return { 
        items: [...state.items, { ...menu, qty, notes }],
        isCartOpen: true
      };
    });
  },

  removeFromCart: (id) => {
    set((state) => ({
      items: state.items.filter(item => item.id !== id)
    }));
  },

  updateQty: (id, qty) => {
    if (qty <= 0) {
      get().removeFromCart(id);
      return;
    }
    set((state) => ({
      items: state.items.map(item => 
        item.id === id ? { ...item, qty } : item
      )
    }));
  },

  updateNotes: (id, notes) => {
    set((state) => ({
      items: state.items.map(item => 
        item.id === id ? { ...item, notes } : item
      )
    }));
  },

  clearCart: () => set({ items: [], isCartOpen: false }),

  getTotalItems: () => {
    return get().items.reduce((total, item) => total + item.qty, 0);
  },

  getTotalPrice: () => {
    return get().items.reduce((total, item) => total + (item.price * item.qty), 0);
  },

  openCart: () => set({ isCartOpen: true }),
  closeCart: () => set({ isCartOpen: false }),
  toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen }))
}));
