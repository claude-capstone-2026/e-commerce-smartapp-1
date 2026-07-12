import { useEffect, useState } from "react";
import { useAdminStore } from "../store/adminStore";
import { ApiError } from "../utils/api";
import type { Product } from "../types";

function AdjustRow({
  product,
  onAdjust,
}: {
  product: Product;
  onAdjust: (productId: string, delta: number, reason: string) => Promise<void>;
}) {
  const [delta, setDelta] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(sign: 1 | -1) {
    const amount = Number(delta);
    if (!Number.isInteger(amount) || amount <= 0) {
      setError("Enter a positive whole number");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await onAdjust(product.id, amount * sign, reason);
      setDelta("");
      setReason("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Adjustment failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <tr className="border-b border-neutral-100">
      <td className="py-3 pr-4">
        <p className="font-medium text-neutral-900">{product.name}</p>
        <p className="text-xs text-neutral-400">{product.category}</p>
      </td>
      <td className="py-3 pr-4 text-right font-semibold text-neutral-900">{product.stockQuantity}</td>
      <td className="py-3">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="number"
            min={1}
            placeholder="Amount"
            value={delta}
            onChange={(e) => setDelta(e.target.value)}
            className="w-24 rounded-md border border-neutral-300 px-2 py-1 text-sm"
          />
          <input
            type="text"
            placeholder="Reason (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-40 rounded-md border border-neutral-300 px-2 py-1 text-sm"
          />
          <button
            disabled={submitting}
            onClick={() => submit(1)}
            className="rounded-md bg-green-600 px-2.5 py-1 text-sm text-white hover:bg-green-700 disabled:opacity-50"
          >
            + Restock
          </button>
          <button
            disabled={submitting}
            onClick={() => submit(-1)}
            className="rounded-md bg-neutral-600 px-2.5 py-1 text-sm text-white hover:bg-neutral-700 disabled:opacity-50"
          >
            − Remove
          </button>
        </div>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </td>
    </tr>
  );
}

export function AdminInventoryPage() {
  const { products, adjustments, loading, fetchAll, adjustStock } = useAdminStore();

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const productName = (id: string) => products.find((p) => p.id === id)?.name ?? id;

  if (loading && products.length === 0) return <p className="p-6 text-neutral-500">Loading inventory…</p>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold text-neutral-900">Inventory Management</h1>

      <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-neutral-500">Products</h2>
      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-xs uppercase text-neutral-400">
              <th className="px-4 py-2 font-medium">Product</th>
              <th className="px-4 py-2 text-right font-medium">Stock</th>
              <th className="px-4 py-2 font-medium">Adjust</th>
            </tr>
          </thead>
          <tbody className="px-4">
            {products.map((product) => (
              <AdjustRow key={product.id} product={product} onAdjust={adjustStock} />
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mb-2 mt-8 text-sm font-medium uppercase tracking-wide text-neutral-500">
        Recent adjustments
      </h2>
      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-xs uppercase text-neutral-400">
              <th className="px-4 py-2 font-medium">Product</th>
              <th className="px-4 py-2 font-medium">Change</th>
              <th className="px-4 py-2 font-medium">New total</th>
              <th className="px-4 py-2 font-medium">Reason</th>
              <th className="px-4 py-2 font-medium">By</th>
              <th className="px-4 py-2 font-medium">When</th>
            </tr>
          </thead>
          <tbody>
            {adjustments.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-neutral-400">
                  No adjustments yet
                </td>
              </tr>
            )}
            {adjustments.map((a) => (
              <tr key={a.id} className="border-b border-neutral-100 last:border-0">
                <td className="px-4 py-2">{productName(a.productId)}</td>
                <td className={`px-4 py-2 font-medium ${a.delta > 0 ? "text-green-600" : "text-red-600"}`}>
                  {a.delta > 0 ? `+${a.delta}` : a.delta}
                </td>
                <td className="px-4 py-2">{a.resultingQuantity}</td>
                <td className="px-4 py-2 text-neutral-500">{a.reason || "—"}</td>
                <td className="px-4 py-2 text-neutral-500">{a.adminName}</td>
                <td className="px-4 py-2 text-neutral-500">{new Date(a.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
