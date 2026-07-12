import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSession } from "../lib/auth-client";

export function AdminRoute({ children }: { children: ReactNode }) {
  const { data, isPending } = useSession();
  const location = useLocation();

  if (isPending) return null;
  if (!data) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/sign-in?redirect=${redirect}`} replace />;
  }
  if (!(data.user as unknown as { isAdmin?: boolean }).isAdmin) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
