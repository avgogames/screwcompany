import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/session";
import { CartView } from "./cart-view";

export const metadata: Metadata = { title: "Cart" };

export default async function CartPage() {
  const user = await getCurrentUser();
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold">Your cart</h1>
      <CartView signedIn={!!user} />
    </div>
  );
}
