import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useCartStore } from "../store/cartStore";

export function CartPage() {
  const { cart, loading, fetchCart, updateQuantity, removeFromCart } = useCartStore();

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  if (loading && cart.items.length === 0) return <p className="p-6 text-neutral-500">Loading cart…</p>;

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-neutral-500">Your cart is empty.</p>
        <Link to="/" className="mt-4 inline-block text-neutral-900 underline">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold text-neutral-900">Your Cart</h1>
      <div className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
        {cart.items.map((item) => (
          <div key={item.productId} className="flex items-center gap-4 p-4">
            <img src={item.imageUrl} alt={item.name} className="h-16 w-16 rounded object-cover" />
            <div className="flex-1">
              <p className="font-medium text-neutral-900">{item.name}</p>
              <p className="text-sm text-neutral-500">${item.price.toFixed(2)} each</p>
            </div>
            <input
              type="number"
              min={1}
              max={item.stockQuantity}
              value={item.quantity}
              onChange={(e) => updateQuantity(item.productId, Math.max(1, Number(e.target.value)))}
              className="w-16 rounded-md border border-neutral-300 px-2 py-1"
            />
            <span className="w-20 text-right font-medium text-neutral-900">${item.lineTotal.toFixed(2)}</span>
            <button
              onClick={() => removeFromCart(item.productId)}
              className="text-sm text-red-600 hover:underline"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
      <div className="mt-6 flex items-center justify-between">
        <span className="text-lg font-semibold text-neutral-900">Total: ${cart.total.toFixed(2)}</span>
        <Link
          to="/checkout"
          className="rounded-md bg-neutral-900 px-5 py-2.5 text-white hover:bg-neutral-700"
        >
          Checkout
        </Link>
      </div>
    </div>
  );
}
