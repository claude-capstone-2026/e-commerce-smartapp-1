import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useOrdersStore } from "../store/ordersStore";

export function MyOrdersPage() {
  const { orders, loading, fetchOrders, cancelOrder } = useOrdersStore();

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  if (loading && orders.length === 0) return <p className="p-6 text-neutral-500">Loading orders…</p>;
  if (orders.length === 0) return <p className="p-6 text-neutral-500">You haven't placed any orders yet.</p>;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold text-neutral-900">My Orders</h1>
      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="rounded-lg border border-neutral-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-neutral-900">Order #{order.id.slice(0, 8)}</p>
                <p className="text-sm text-neutral-500">{new Date(order.createdAt).toLocaleString()}</p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  order.status === "cancelled"
                    ? "bg-neutral-100 text-neutral-500"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {order.status}
              </span>
            </div>
            <div className="mt-3 divide-y divide-neutral-100 border-t border-neutral-100 pt-2">
              {order.items?.map((item) => (
                <div key={item.productId} className="flex justify-between py-1.5 text-sm text-neutral-600">
                  <span>
                    {item.name} × {item.quantity}
                  </span>
                  <span>${(item.unitPrice * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="font-semibold text-neutral-900">${order.total.toFixed(2)}</span>
              <div className="flex items-center gap-4">
                <Link to={`/orders/${order.id}`} className="text-sm text-neutral-600 hover:underline">
                  View receipt
                </Link>
                {order.status === "placed" && (
                  <button
                    onClick={() => cancelOrder(order.id)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Cancel order
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
