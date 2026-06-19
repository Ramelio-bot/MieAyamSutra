import { create } from 'zustand';
import { MenuItem } from '@/types';
import { MOCK_MENUS } from '@/lib/constants';

interface MenuState {
  menus: MenuItem[];
  addMenu: (menu: MenuItem) => void;
  toggleAvailability: (id: string) => void;
  deleteMenu: (id: string) => void;
  resetMenus: () => void;
  updateMenuImage: (id: string, imageUrl: string) => void;
  updateMenuItem: (id: string, updatedFields: Partial<MenuItem>) => void;
}

export const useMenu = create<MenuState>((set) => {
  // Safe localStorage fetch
  const getInitialMenus = (): MenuItem[] => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('sutra_menus');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {
          console.error("Failed to parse menus from localStorage", e);
        }
      }
    }
    return MOCK_MENUS;
  };

  return {
    menus: getInitialMenus(),
    addMenu: (menu) => {
      set((state) => {
        const newMenus = [...state.menus, menu];
        if (typeof window !== 'undefined') {
          localStorage.setItem('sutra_menus', JSON.stringify(newMenus));
        }
        return { menus: newMenus };
      });
    },
    toggleAvailability: (id) => {
      set((state) => {
        const newMenus = state.menus.map(item => 
          item.id === id ? { ...item, is_available: !item.is_available } : item
        );
        if (typeof window !== 'undefined') {
          localStorage.setItem('sutra_menus', JSON.stringify(newMenus));
        }
        return { menus: newMenus };
      });
    },
    deleteMenu: (id) => {
      set((state) => {
        const newMenus = state.menus.filter(item => item.id !== id);
        if (typeof window !== 'undefined') {
          localStorage.setItem('sutra_menus', JSON.stringify(newMenus));
        }
        return { menus: newMenus };
      });
    },
    resetMenus: () => {
      set(() => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('sutra_menus');
        }
        return { menus: MOCK_MENUS };
      });
    },
    updateMenuImage: (id, imageUrl) => {
      set((state) => {
        const newMenus = state.menus.map(item => 
          item.id === id ? { ...item, image_url: imageUrl } : item
        );
        if (typeof window !== 'undefined') {
          localStorage.setItem('sutra_menus', JSON.stringify(newMenus));
        }
        return { menus: newMenus };
      });
    },
    updateMenuItem: (id, updatedFields) => {
      set((state) => {
        const newMenus = state.menus.map(item => 
          item.id === id ? { ...item, ...updatedFields } : item
        );
        if (typeof window !== 'undefined') {
          localStorage.setItem('sutra_menus', JSON.stringify(newMenus));
        }
        return { menus: newMenus };
      });
    }
  };
});
