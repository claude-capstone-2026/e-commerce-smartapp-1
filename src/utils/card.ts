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

export function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 19);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

export function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length < 3) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export interface CardFormValues {
  cardNumber: string;
  cardName: string;
  cardExpiry: string;
  cardCvc: string;
}

export function validateCard(values: CardFormValues): string | null {
  const digits = values.cardNumber.replace(/\s+/g, "");
  if (values.cardName.trim().length < 2) return "Enter the name on the card";
  if (!/^\d{13,19}$/.test(digits) || !luhnCheck(digits)) return "Enter a valid card number";
  if (!/^\d{2}\/\d{2}$/.test(values.cardExpiry)) return "Enter expiry as MM/YY";
  const [monthStr, yearStr] = values.cardExpiry.split("/");
  const month = Number(monthStr);
  if (month < 1 || month > 12) return "Enter a valid expiry month";
  const expiryEnd = new Date(2000 + Number(yearStr), month, 1);
  if (expiryEnd.getTime() <= Date.now()) return "Card has expired";
  if (!/^\d{3,4}$/.test(values.cardCvc)) return "Enter a valid CVC";
  return null;
}
