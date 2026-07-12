import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCartStore } from "../store/cartStore";
import { apiFetch, ApiError } from "../utils/api";
import type { Order } from "../types";

export function CheckoutPage() {
  const { cart, fetchCart } = useCartStore();
  const navigate = useNavigate();
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  useEffect(() => {
    if (!placing && cart.items.length === 0) {
      navigate("/", { replace: true });
    }
  }, [cart.items.length, placing, navigate]);

  async function handleConfirm() {
    setError(null);
    setPlacing(true);
    try {
      const order = await apiFetch<Order>("/api/orders", { method: "POST" });
      await fetchCart(); // cart is now empty server-side
      navigate(`/orders/${order.id}`, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't place order");
      setPlacing(false);
    }
  }

  if (cart.items.length === 0) return null;

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold text-neutral-900">Review &amp; Confirm</h1>
      <div className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
        {cart.items.map((item) => (
          <div key={item.productId} className="flex justify-between p-4 text-sm">
            <span>
              {item.name} × {item.quantity}
            </span>
            <span className="font-medium">${item.lineTotal.toFixed(2)}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-between text-lg font-semibold text-neutral-900">
        <span>Total</span>
        <span>${cart.total.toFixed(2)}</span>
      </div>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={() => navigate("/cart")}
          className="rounded-md border border-neutral-300 px-5 py-2.5 text-neutral-700 hover:bg-neutral-50"
        >
          Back to Cart
        </button>
        <button
          onClick={handleConfirm}
          disabled={placing}
          className="rounded-md bg-neutral-900 px-5 py-2.5 text-white hover:bg-neutral-700 disabled:opacity-50"
        >
          {placing ? "Placing order…" : "Place Order"}
        </button>
      </div>
    </div>
  );
}
