import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { trackEvent } from "@/lib/analytics-client";

export interface CartItem {
  id: string;
  productId: string;
  categoryId?: string;
  productName: string;
  productImage: string;
  price: number;
  discountCode?: string;
  quantity: number;
  variants?: {
    SIZE?: string;
    TYPE?: string;
    DECOR?: string;
    ACCESSORY?: string;
    [key: string]: string | undefined;
  };
  customOptions?: {
    hasLight?: boolean;
    [key: string]: boolean | undefined;
  };
  selected?: boolean; // Thêm trường selected
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (productId: string, variants?: CartItem["variants"], recordAnalytics?: boolean) => void;
  updateQuantity: (productId: string, quantity: number, variants?: CartItem["variants"]) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartCount: () => number;
  toggleSelectItem: (id: string) => void;
  selectAllItems: (selected: boolean) => void;
  getSelectedTotal: () => number;
  getSelectedItems: () => CartItem[];
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        trackEvent({ type: "ADD_TO_CART", productId: item.productId, metadata: { quantity: item.quantity } });
        set((state) => {
          const existingItemIndex = state.items.findIndex(
            (existingItem) =>
              existingItem.productId === item.productId &&
              JSON.stringify(existingItem.variants) === JSON.stringify(item.variants) &&
              existingItem.discountCode === item.discountCode
          );

          if (existingItemIndex > -1) {
            const updatedItems = [...state.items];
            updatedItems[existingItemIndex].quantity += item.quantity;
            updatedItems[existingItemIndex].selected = true; // Auto select when adding more
            return { items: updatedItems };
          }

          return {
            items: [
              ...state.items,
              {
                ...item,
                id: `${item.productId}-${JSON.stringify(item.variants)}-${Date.now()}`,
                selected: true, // Default selected
              },
            ],
          };
        });
      },

      removeItem: (productId, variants, recordAnalytics = true) => {
        if (recordAnalytics) {
          const existing = get().items.find(
            (item) => item.productId === productId && JSON.stringify(item.variants) === JSON.stringify(variants)
          );
          trackEvent({ type: "REMOVE_FROM_CART", productId, metadata: { quantity: existing?.quantity || 1 } });
        }
        set((state) => ({
          items: state.items.filter(
            (item) =>
              !(
                item.productId === productId &&
                JSON.stringify(item.variants) === JSON.stringify(variants)
              )
          ),
        }));
      },

      updateQuantity: (productId, quantity, variants) => {
        if (quantity <= 0) {
          get().removeItem(productId, variants);
          return;
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.productId === productId &&
            JSON.stringify(item.variants) === JSON.stringify(variants)
              ? { ...item, quantity }
              : item
          ),
        }));
      },

      clearCart: () => {
        set({ items: [] });
      },

      getCartTotal: () => {
        return get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );
      },

      getCartCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },

      toggleSelectItem: (id) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, selected: !item.selected } : item
          ),
        }));
      },

      selectAllItems: (selected) => {
        set((state) => ({
          items: state.items.map((item) => ({ ...item, selected })),
        }));
      },

      getSelectedTotal: () => {
        return get().items
          .filter((item) => item.selected)
          .reduce((total, item) => total + item.price * item.quantity, 0);
      },

      getSelectedItems: () => {
        return get().items.filter((item) => item.selected);
      },
    }),
    {
      name: "cart-storage",
      skipHydration: true,
    }
  )
);
