import { useState } from "react";
import { formatCardNumber, formatExpiry, validateCard, type CardFormValues } from "../utils/card";

export function PaymentForm({
  onSubmit,
  submitting,
  submitLabel,
}: {
  onSubmit: (values: CardFormValues) => void;
  submitting: boolean;
  submitLabel: string;
}) {
  const [values, setValues] = useState<CardFormValues>({
    cardNumber: "",
    cardName: "",
    cardExpiry: "",
    cardCvc: "",
  });
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationError = validateCard(values);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    onSubmit(values);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">
        This is a demo checkout — no real payment is processed and no card data is sent to a
        payment network.
      </p>
      <div>
        <label className="mb-1 block text-sm text-neutral-600">Name on card</label>
        <input
          type="text"
          required
          value={values.cardName}
          onChange={(e) => setValues((v) => ({ ...v, cardName: e.target.value }))}
          className="w-full rounded-md border border-neutral-300 px-3 py-2"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-neutral-600">Card number</label>
        <input
          type="text"
          inputMode="numeric"
          required
          placeholder="4242 4242 4242 4242"
          value={values.cardNumber}
          onChange={(e) => setValues((v) => ({ ...v, cardNumber: formatCardNumber(e.target.value) }))}
          className="w-full rounded-md border border-neutral-300 px-3 py-2"
        />
      </div>
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="mb-1 block text-sm text-neutral-600">Expiry (MM/YY)</label>
          <input
            type="text"
            inputMode="numeric"
            required
            placeholder="12/28"
            value={values.cardExpiry}
            onChange={(e) => setValues((v) => ({ ...v, cardExpiry: formatExpiry(e.target.value) }))}
            className="w-full rounded-md border border-neutral-300 px-3 py-2"
          />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-sm text-neutral-600">CVC</label>
          <input
            type="text"
            inputMode="numeric"
            required
            placeholder="123"
            value={values.cardCvc}
            onChange={(e) =>
              setValues((v) => ({ ...v, cardCvc: e.target.value.replace(/\D/g, "").slice(0, 4) }))
            }
            className="w-full rounded-md border border-neutral-300 px-3 py-2"
          />
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-md bg-neutral-900 px-4 py-2.5 text-white hover:bg-neutral-700 disabled:opacity-50"
      >
        {submitting ? "Processing payment…" : submitLabel}
      </button>
    </form>
  );
}
