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
    <div className="mx-auto max-w-xl px-4 py-12">
      <div className="print:hidden mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">
          {order.status === "cancelled" ? "Order cancelled" : "Thanks for your order!"}
        </h1>
        <button
          onClick={() => window.print()}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50"
        >
          Print / Save as PDF
        </button>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-6 print:border-0 print:p-0">
        <div className="flex items-start justify-between border-b border-neutral-200 pb-4">
          <div>
            <p className="text-lg font-semibold text-neutral-900">Receipt</p>
            <p className="text-sm text-neutral-500">Order #{order.id.slice(0, 8)}</p>
          </div>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              order.status === "cancelled" ? "bg-neutral-100 text-neutral-500" : "bg-green-100 text-green-700"
            }`}
          >
            {order.status}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 border-b border-neutral-200 py-4 text-sm">
          <div>
            <p className="text-neutral-400">Date</p>
            <p className="text-neutral-800">{new Date(order.createdAt).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-neutral-400">Transaction ID</p>
            <p className="text-neutral-800">{order.transactionId}</p>
          </div>
          <div>
            <p className="text-neutral-400">Payment method</p>
            <p className="text-neutral-800">
              {order.cardBrand} •••• {order.cardLast4}
            </p>
          </div>
        </div>

        <div className="divide-y divide-neutral-100 py-2">
          {order.items?.map((item) => (
            <div key={item.productId} className="flex justify-between py-2 text-sm">
              <span>
                {item.name} × {item.quantity}
              </span>
              <span className="font-medium">${(item.unitPrice * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className="flex justify-between border-t border-neutral-200 pt-4 text-lg font-semibold text-neutral-900">
          <span>Total</span>
          <span>${order.total.toFixed(2)}</span>
        </div>
      </div>

      <Link to="/" className="print:hidden mt-6 inline-block text-neutral-900 underline">
        Continue shopping
      </Link>
    </div>
  );
}
