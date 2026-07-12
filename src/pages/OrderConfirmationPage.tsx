import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiFetch } from "../utils/api";
import type { Order } from "../types";

export function OrderConfirmationPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!id) return;
    apiFetch<Order>(`/api/orders/${id}`).then(setOrder);
  }, [id]);

  if (!order) return <p className="p-6 text-neutral-500">Loading…</p>;

  return (
    <div className="mx-auto max-w-xl px-4 py-12 text-center">
      <h1 className="text-2xl font-semibold text-neutral-900">Thanks for your order!</h1>
      <p className="mt-2 text-neutral-500">Order #{order.id.slice(0, 8)}</p>
      <div className="mt-6 divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white text-left">
        {order.items?.map((item) => (
          <div key={item.productId} className="flex justify-between p-4 text-sm">
            <span>
              {item.name} × {item.quantity}
            </span>
            <span className="font-medium">${(item.unitPrice * item.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>
      <p className="mt-4 text-lg font-semibold text-neutral-900">Total: ${order.total.toFixed(2)}</p>
      <Link to="/" className="mt-6 inline-block text-neutral-900 underline">
        Continue shopping
      </Link>
    </div>
  );
}
