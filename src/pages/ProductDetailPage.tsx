import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch, ApiError } from "../utils/api";
import { useCartStore } from "../store/cartStore";
import type { Product } from "../types";

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const addToCart = useCartStore((s) => s.addToCart);

  useEffect(() => {
    if (!id) return;
    apiFetch<Product>(`/api/products/${id}`)
      .then(setProduct)
      .catch(() => navigate("/", { replace: true }));
  }, [id, navigate]);

  if (!product) return <p className="p-6 text-neutral-500">Loading…</p>;

  const outOfStock = product.stockQuantity <= 0;

  async function handleAddToCart() {
    setError(null);
    setAdding(true);
    try {
      await addToCart(product!.id, quantity);
      navigate("/cart");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't add to cart");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 px-4 py-8 sm:grid-cols-2">
      <div className="aspect-square overflow-hidden rounded-lg bg-neutral-100">
        <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
      </div>
      <div>
        <span className="text-xs uppercase tracking-wide text-neutral-400">{product.category}</span>
        <h1 className="mt-1 text-2xl font-semibold text-neutral-900">{product.name}</h1>
        <p className="mt-3 text-neutral-600">{product.description}</p>
        <p className="mt-4 text-xl font-semibold text-neutral-900">${product.price.toFixed(2)}</p>

        {outOfStock ? (
          <p className="mt-4 font-medium text-red-600">Out of stock</p>
        ) : (
          <>
            <p className="mt-1 text-sm text-neutral-500">{product.stockQuantity} in stock</p>
            <div className="mt-4 flex items-center gap-3">
              <input
                type="number"
                min={1}
                max={product.stockQuantity}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                className="w-20 rounded-md border border-neutral-300 px-2 py-1.5"
              />
              <button
                onClick={handleAddToCart}
                disabled={adding}
                className="rounded-md bg-neutral-900 px-4 py-2 text-white hover:bg-neutral-700 disabled:opacity-50"
              >
                {adding ? "Adding…" : "Add to Cart"}
              </button>
            </div>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </>
        )}
      </div>
    </div>
  );
}
