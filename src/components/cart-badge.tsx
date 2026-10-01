"use client";

import Link from "next/link";
import { useCart } from "./cart-context";

export function CartBadge() {
  const { count } = useCart();
  return (
    <Link href="/cart" className="relative inline-flex items-center gap-2 rounded-md px-3 py-2 hover:bg-white/10">
      <span>Cart</span>
      {count > 0 && (
        <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-slate-900">{count}</span>
      )}
    </Link>
  );
}
