import { create } from "zustand";
import { apiFetch } from "../utils/api";
import type { Cart } from "../types";

interface CartState {
  cart: Cart;
  loading: boolean;
  fetchCart: () => Promise<void>;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
}

export const useCartStore = create<CartState>()((set, get) => ({
  cart: { items: [], total: 0 },
  loading: false,

  fetchCart: async () => {
    set({ loading: true });
    const cart = await apiFetch<Cart>("/api/cart");
    set({ cart, loading: false });
  },

  addToCart: async (productId, quantity = 1) => {
    await apiFetch("/api/cart", { method: "POST", body: JSON.stringify({ productId, quantity }) });
    await get().fetchCart();
  },

  updateQuantity: async (productId, quantity) => {
    await apiFetch(`/api/cart/${productId}`, { method: "PATCH", body: JSON.stringify({ quantity }) });
    await get().fetchCart();
  },

  removeFromCart: async (productId) => {
    await apiFetch(`/api/cart/${productId}`, { method: "DELETE" });
    await get().fetchCart();
  },
}));
