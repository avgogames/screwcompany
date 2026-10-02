import type { Metadata } from "next";
import { api } from "@/lib/api";
import { CartView } from "./cart-view";

export const metadata: Metadata = { title: "Cart" };

export default async function CartPage() {
  const [user, products] = await Promise.all([api.me(), api.products()]);
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold">Your cart</h1>
      <CartView signedIn={!!user} products={products} />
    </div>
  );
}
