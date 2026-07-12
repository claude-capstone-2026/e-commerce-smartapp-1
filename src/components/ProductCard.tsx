import { Link } from "react-router-dom";
import type { Product } from "../types";

export function ProductCard({ product }: { product: Product }) {
  const outOfStock = product.stockQuantity <= 0;

  return (
    <Link
      to={`/products/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white transition hover:shadow-md"
    >
      <div className="aspect-square overflow-hidden bg-neutral-100">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="h-full w-full object-cover transition group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <span className="text-xs uppercase tracking-wide text-neutral-400">{product.category}</span>
        <h3 className="font-medium text-neutral-900">{product.name}</h3>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="font-semibold text-neutral-900">${product.price.toFixed(2)}</span>
          {outOfStock ? (
            <span className="text-xs font-medium text-red-600">Out of stock</span>
          ) : product.stockQuantity <= 5 ? (
            <span className="text-xs font-medium text-amber-600">{product.stockQuantity} left</span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
