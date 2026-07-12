import { useEffect, useState } from "react";
import { apiFetch } from "../utils/api";
import { ProductCard } from "../components/ProductCard";
import type { Product } from "../types";

export function ProductListPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<Product[]>("/api/products")
      .then(setProducts)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="p-6 text-neutral-500">Loading products…</p>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold text-neutral-900">Shop</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
