import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: number;
  name: string;
  image: string;
  price: number;
  quantity: number;
}

interface CartState {
  cartItems: CartItem[];

  addCartItem: (item: CartItem) => void;
  removeCartItem: (id: number) => void;
  updateCartQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      cartItems: [],

      addCartItem: (item) =>
        set((state) => {
          const existItem = state.cartItems.find((cartItem) => cartItem.id === item.id);

          if (existItem) {
            return {
              cartItems: state.cartItems.map((cartItem) =>
                cartItem.id === item.id
                  ? {
                      ...cartItem,
                      quantity: cartItem.quantity + item.quantity,
                    }
                  : cartItem,
              ),
            };
          }

          return {
            cartItems: [...state.cartItems, item],
          };
        }),

      removeCartItem: (id) =>
        set((state) => ({
          cartItems: state.cartItems.filter((item) => item.id !== id),
        })),

      updateCartQuantity: (id, quantity) =>
        set((state) => ({
          cartItems: state.cartItems.map((item) =>
            item.id === id
              ? {
                  ...item,
                  quantity,
                }
              : item,
          ),
        })),

      clearCart: () =>
        set({
          cartItems: [],
        }),
    }),
    {
      name: "cart-storage",
    },
  ),
);
