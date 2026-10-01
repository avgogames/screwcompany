"use client";

import { useState } from "react";
import { useCart } from "./cart-context";

export function AddToCart({ productId, minQty }: { productId: string; minQty: number }) {
  const { add } = useCart();
  const [qty, setQty] = useState(minQty);
  const [added, setAdded] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="flex items-center gap-2 text-sm">
        Qty
        <input
          type="number"
          min={minQty}
          value={qty}
          onChange={(e) => setQty(Math.max(minQty, Number(e.target.value) || minQty))}
          className="w-24 rounded-md border border-slate-300 px-3 py-2"
        />
      </label>
      <button
        type="button"
        onClick={() => {
          add(productId, qty);
          setAdded(true);
          setTimeout(() => setAdded(false), 1500);
        }}
        className="rounded-md bg-slate-900 px-5 py-2.5 font-semibold text-white hover:bg-slate-700"
      >
        {added ? "Added ✓" : "Add to cart"}
      </button>
    </div>
  );
}
