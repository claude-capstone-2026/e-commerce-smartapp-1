import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { signIn, useSession } from "../lib/auth-client";

export function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refetch: refetchSession } = useSession();

  const redirectTo = searchParams.get("redirect") || "/";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error } = await signIn.email({ email, password });
    if (error) {
      setError(error.message ?? "Sign in failed");
      setSubmitting(false);
      return;
    }

    // signIn.email() resolves before Better Auth's shared session store updates. A route
    // guard reading useSession() immediately after navigate() can still see "signed out" and
    // bounce back to sign-in — force the refresh first to close that race.
    await refetchSession();
    navigate(redirectTo, { replace: true });
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="mb-6 text-2xl font-semibold text-neutral-900">Sign in</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md border border-neutral-300 px-3 py-2"
        />
        <input
          type="password"
          required
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-md border border-neutral-300 px-3 py-2"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-neutral-900 px-4 py-2 text-white hover:bg-neutral-700 disabled:opacity-50"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="mt-4 text-sm text-neutral-500">
        No account?{" "}
        <Link to={`/sign-up?redirect=${encodeURIComponent(redirectTo)}`} className="text-neutral-900 underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
