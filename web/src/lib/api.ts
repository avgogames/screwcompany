import "server-only";
import { cookies } from "next/headers";
import type { Order, Product, User } from "./types";

const API_URL = (process.env.API_URL ?? "http://localhost:4000").replace(/\/$/, "");

/** Calls the API service from the server, forwarding the visitor's cookies so the API knows who they are. */
async function getJson<T>(path: string): Promise<T | null> {
  const cookieHeader = (await cookies()).toString();
  const res = await fetch(`${API_URL}${path}`, {
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
    cache: "no-store",
  });
  if (res.status === 401 || res.status === 404) return null;
  if (!res.ok) throw new Error(`API ${path} failed with ${res.status}`);
  return res.json() as Promise<T>;
}

export const api = {
  products: async () => (await getJson<Product[]>("/api/products")) ?? [],
  product: (slug: string) => getJson<Product>(`/api/products/${encodeURIComponent(slug)}`),
  me: () => getJson<User>("/api/auth/me"),
  orders: async () => (await getJson<Order[]>("/api/orders")) ?? [],
  confirmCheckout: (sessionId: string) =>
    getJson<Order>(`/api/checkout/confirm?session_id=${encodeURIComponent(sessionId)}`),
};
