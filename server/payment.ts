import { HttpError } from "./db/pool.js";

export interface CardDetails {
  cardNumber: string;
  cardName: string;
  cardExpiry: string; // MM/YY
  cardCvc: string;
}

function luhnCheck(digits: string): boolean {
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = Number(digits[i]);
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

function cardBrand(digits: string): string {
  if (digits.startsWith("4")) return "Visa";
  if (/^5[1-5]/.test(digits)) return "Mastercard";
  if (/^3[47]/.test(digits)) return "Amex";
  return "Card";
}

// Dummy payment "processor": validates card-shaped input (format only, no real payment
// network involved) and returns what a receipt would show. Never persists the full number/CVC.
export function processDummyPayment(body: unknown): { brand: string; last4: string } {
  const { cardNumber, cardName, cardExpiry, cardCvc } = (body ?? {}) as Partial<CardDetails>;

  if (typeof cardName !== "string" || cardName.trim().length < 2) {
    throw new HttpError(400, "Enter the name on the card");
  }

  const digits = (typeof cardNumber === "string" ? cardNumber : "").replace(/\s+/g, "");
  if (!/^\d{13,19}$/.test(digits) || !luhnCheck(digits)) {
    throw new HttpError(400, "Enter a valid card number");
  }

  if (typeof cardExpiry !== "string" || !/^\d{2}\/\d{2}$/.test(cardExpiry)) {
    throw new HttpError(400, "Enter expiry as MM/YY");
  }
  const [monthStr, yearStr] = cardExpiry.split("/");
  const month = Number(monthStr);
  const year = 2000 + Number(yearStr);
  if (month < 1 || month > 12) {
    throw new HttpError(400, "Enter a valid expiry month");
  }
  const expiryEnd = new Date(year, month, 1); // first day of the month after expiry
  if (expiryEnd.getTime() <= Date.now()) {
    throw new HttpError(400, "Card has expired");
  }

  if (typeof cardCvc !== "string" || !/^\d{3,4}$/.test(cardCvc)) {
    throw new HttpError(400, "Enter a valid CVC");
  }

  return { brand: cardBrand(digits), last4: digits.slice(-4) };
}
