// Shapes returned by the API service (see api/src).

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  specs: Record<string, string>;
  priceCents: number;
  unit: string;
  minQty: number;
};

export type User = {
  id: string;
  phone: string;
  name: string;
  company: string | null;
};

export type OrderItem = {
  id: string;
  productId: string;
  name: string;
  unitPriceCents: number;
  quantity: number;
};

export type Order = {
  id: string;
  status: "pending" | "paid" | "canceled";
  totalCents: number;
  currency: string;
  createdAt: string;
  items: OrderItem[];
};
