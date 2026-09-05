import { create } from 'zustand';
import { CartItem, MenuItem } from '@/types';

interface CartState {
  items: CartItem[];
  isCartOpen: boolean;
  hydrate: () => void;
  persist: () => void;
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
  isStoreOpen: boolean;
  closedMessage: string;
  setStoreStatus: (isOpen: boolean, message: string) => void;
}

export const useCart = create<CartState>((set, get) => ({
  items: [],
  isCartOpen: false,
  isStoreOpen: true,
  closedMessage: "Maaf, kedai sedang tutup.",

  setStoreStatus: (isOpen, message) => set({ isStoreOpen: isOpen, closedMessage: message }),

  hydrate: () => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('sutra_cart');
      if (!raw) return;
      const items = JSON.parse(raw) as CartItem[];
      set({ items, isCartOpen: false });
    } catch {
      // ignore corrupt cart storage
    }
  },

  persist() {
    if (typeof window === 'undefined') return;
    localStorage.setItem('sutra_cart', JSON.stringify(get().items));
  },
  
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
          isCartOpen: true
        };
      }
      return { 
        items: [...state.items, { ...menu, qty, notes }],
        isCartOpen: true
      };
    });
    get().persist();
  },

  removeFromCart: (id) => {
    set((state) => ({
      items: state.items.filter(item => item.id !== id)
    }));
    get().persist();
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
    get().persist();
  },

  updateNotes: (id, notes) => {
    set((state) => ({
      items: state.items.map(item => 
        item.id === id ? { ...item, notes } : item
      )
    }));
    get().persist();
  },

  clearCart: () => {
    set({ items: [], isCartOpen: false });
    if (typeof window !== 'undefined') localStorage.removeItem('sutra_cart');
  },

  getTotalItems: () => {
    return get().items.reduce((total, item) => total + item.qty, 0);
  },

  getTotalPrice: () => {
    return get().items.reduce((total, item) => {
      const activePrice = item.discount_price || item.price;
      return total + (activePrice * item.qty);
    }, 0);
  },

  openCart: () => set({ isCartOpen: true }),
  closeCart: () => set({ isCartOpen: false }),
  toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen }))
}));

// Cross-tab synchronization for Cart
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'sutra_cart') {
      try {
        if (!e.newValue) {
          useCart.setState({ items: [] });
          return;
        }
        const parsed = JSON.parse(e.newValue);
        useCart.setState({ items: parsed });
      } catch (err) {
        console.error("Failed to parse sutra_cart from storage event", err);
      }
    }
  });
}
