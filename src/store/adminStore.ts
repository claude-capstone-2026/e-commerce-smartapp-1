import { create } from "zustand";
import { apiFetch } from "../utils/api";
import type { Product, StockAdjustment } from "../types";

interface AdminState {
  products: Product[];
  adjustments: StockAdjustment[];
  loading: boolean;
  fetchAll: () => Promise<void>;
  adjustStock: (productId: string, delta: number, reason: string) => Promise<void>;
}

export const useAdminStore = create<AdminState>()((set, get) => ({
  products: [],
  adjustments: [],
  loading: false,

  fetchAll: async () => {
    set({ loading: true });
    const [products, adjustments] = await Promise.all([
      apiFetch<Product[]>("/api/admin/products"),
      apiFetch<StockAdjustment[]>("/api/admin/stock-adjustments"),
    ]);
    set({ products, adjustments, loading: false });
  },

  adjustStock: async (productId, delta, reason) => {
    await apiFetch(`/api/admin/products/${productId}/stock-adjustments`, {
      method: "POST",
      body: JSON.stringify({ delta, reason }),
    });
    await get().fetchAll();
  },
}));
