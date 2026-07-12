import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useSession, signOut } from "../lib/auth-client";
import { useCartStore } from "../store/cartStore";

export function Navbar() {
  const { data } = useSession();
  const navigate = useNavigate();
  const cart = useCartStore((s) => s.cart);
  const fetchCart = useCartStore((s) => s.fetchCart);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const itemCount = cart.items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <nav className="print:hidden border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-lg font-semibold tracking-tight text-neutral-900">
          Smartapp Store
        </Link>
        <div className="flex items-center gap-5 text-sm">
          {data ? (
            <>
              <Link to="/my-orders" className="text-neutral-600 hover:text-neutral-900">
                My Orders
              </Link>
              {(data.user as unknown as { isAdmin?: boolean }).isAdmin && (
                <Link to="/admin/inventory" className="text-neutral-600 hover:text-neutral-900">
                  Inventory
                </Link>
              )}
              <span className="text-neutral-400">{data.user.email}</span>
              <button
                onClick={async () => {
                  await signOut();
                  navigate("/");
                }}
                className="text-neutral-600 hover:text-neutral-900"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link to="/sign-in" className="text-neutral-600 hover:text-neutral-900">
              Sign in
            </Link>
          )}
          <Link
            to="/cart"
            className="relative rounded-md bg-neutral-900 px-3 py-1.5 text-white hover:bg-neutral-700"
          >
            Cart
            {itemCount > 0 && (
              <span className="ml-1.5 rounded-full bg-white px-1.5 text-xs font-semibold text-neutral-900">
                {itemCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </nav>
  );
}
