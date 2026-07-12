export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  stockQuantity: number;
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  imageUrl: string;
  quantity: number;
  stockQuantity: number;
  lineTotal: number;
}

export interface Cart {
  items: CartItem[];
  total: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
}

export interface Order {
  id: string;
  status: "placed" | "cancelled";
  total: number;
  transactionId: string;
  cardBrand: string;
  cardLast4: string;
  createdAt: string;
  items?: OrderItem[];
}

export interface CardDetails {
  cardNumber: string;
  cardName: string;
  cardExpiry: string;
  cardCvc: string;
}

export interface StockAdjustment {
  id: number;
  productId: string;
  delta: number;
  resultingQuantity: number;
  reason: string;
  adminName: string;
  createdAt: string;
}
