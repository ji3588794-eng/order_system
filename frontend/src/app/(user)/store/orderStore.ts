import { create } from "zustand";
import { persist } from "zustand/middleware";

export type OrderItem = {
  id: number;
  name: string;
  image: string;
  price: number;
  quantity: number;
};

type OrderStore = {
  orderItems: OrderItem[];
  setOrderItems: (items: OrderItem[]) => void;
  clearOrderItems: () => void;
};

export const useOrderStore = create<OrderStore>()(
  persist(
    (set) => ({
      orderItems: [],
      setOrderItems: (items) => set({ orderItems: items }),
      clearOrderItems: () => set({ orderItems: [] }),
    }),
    {
      name: "order-storage",
    },
  ),
);
