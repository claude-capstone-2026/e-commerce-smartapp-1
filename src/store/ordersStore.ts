import { create } from "zustand";
import { apiFetch } from "../utils/api";
import type { Order } from "../types";

interface OrdersState {
  orders: Order[];
  loading: boolean;
  fetchOrders: () => Promise<void>;
  cancelOrder: (id: string) => Promise<void>;
}

export const useOrdersStore = create<OrdersState>()((set, get) => ({
  orders: [],
  loading: false,

  fetchOrders: async () => {
    set({ loading: true });
    const orders = await apiFetch<Order[]>("/api/orders/mine");
    set({ orders, loading: false });
  },

  cancelOrder: async (id) => {
    await apiFetch(`/api/orders/${id}/cancel`, { method: "POST" });
    await get().fetchOrders();
  },
}));
