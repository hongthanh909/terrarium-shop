import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface CartItem {
  id: string;
  productId: string;
  categoryId?: string;
  productName: string;
  productImage: string;
  price: number;
  quantity: number;
  variants?: {
    SIZE?: string;
    TYPE?: string;
    DECOR?: string;
    ACCESSORY?: string;
  };
  customOptions?: {
    hasLight?: boolean;
    [key: string]: boolean | undefined;
  };
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (productId: string, variants?: CartItem["variants"]) => void;
  updateQuantity: (productId: string, quantity: number, variants?: CartItem["variants"]) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartCount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        set((state) => {
          const existingItemIndex = state.items.findIndex(
            (existingItem) =>
              existingItem.productId === item.productId &&
              JSON.stringify(existingItem.variants) === JSON.stringify(item.variants)
          );

          if (existingItemIndex > -1) {
            const updatedItems = [...state.items];
            updatedItems[existingItemIndex].quantity += item.quantity;
            return { items: updatedItems };
          }

          return {
            items: [
              ...state.items,
              {
                ...item,
                id: `${item.productId}-${JSON.stringify(item.variants)}-${Date.now()}`,
              },
            ],
          };
        });
      },

      removeItem: (productId, variants) => {
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
    }),
    {
      name: "cart-storage",
      skipHydration: true,
    }
  )
);