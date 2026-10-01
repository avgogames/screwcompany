"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useCart } from "@/components/cart-context";
import { formatPrice, getProduct } from "@/lib/products";
import { checkoutAction } from "../checkout/actions";

export function CartView({ signedIn }: { signedIn: boolean }) {
  const { lines, ready, setQuantity, remove } = useCart();
  const [state, formAction, pending] = useActionState(checkoutAction, {});

  if (!ready) return <p className="mt-6 text-slate-500">Loading…</p>;

  const rows = lines.flatMap((l) => {
    const product = getProduct(l.productId);
    return product ? [{ ...l, product }] : [];
  });

  if (rows.length === 0) {
    return (
      <div className="mt-8 rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
        <p className="text-slate-600">Your cart is empty.</p>
        <Link href="/products" className="mt-4 inline-block font-semibold text-amber-700 hover:underline">
          Browse products →
        </Link>
      </div>
    );
  }

  const total = rows.reduce((sum, r) => sum + r.product.priceCents * r.quantity, 0);

  return (
    <div className="mt-8 space-y-6">
      <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
        {rows.map(({ product, quantity }) => (
          <li key={product.id} className="flex flex-wrap items-center gap-4 p-4">
            <div className="min-w-48 flex-1">
              <Link href={`/products/${product.slug}`} className="font-semibold hover:underline">
                {product.name}
              </Link>
              <p className="text-sm text-slate-500">
                {formatPrice(product.priceCents)} / {product.unit}
                {product.minQty > 1 && ` · min ${product.minQty}`}
              </p>
            </div>
            <input
              type="number"
              aria-label={`Quantity for ${product.name}`}
              min={product.minQty}
              value={quantity}
              onChange={(e) => setQuantity(product.id, Math.max(product.minQty, Number(e.target.value) || product.minQty))}
              className="w-24 rounded-md border border-slate-300 px-3 py-2"
            />
            <span className="w-28 text-right font-semibold">{formatPrice(product.priceCents * quantity)}</span>
            <button type="button" onClick={() => remove(product.id)} className="text-sm text-red-600 hover:underline">
              Remove
            </button>
          </li>
        ))}
      </ul>

      <div className="flex flex-col items-end gap-3">
        <p className="text-lg">
          Subtotal: <span className="font-bold">{formatPrice(total)}</span>
        </p>
        <p className="text-sm text-slate-500">Shipping and taxes are calculated at checkout.</p>
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        {signedIn ? (
          <form action={formAction}>
            <input
              type="hidden"
              name="cart"
              value={JSON.stringify(rows.map((r) => ({ productId: r.productId, quantity: r.quantity })))}
            />
            <button
              disabled={pending}
              className="rounded-md bg-amber-500 px-6 py-3 font-semibold text-slate-900 hover:bg-amber-400 disabled:opacity-60"
            >
              {pending ? "Redirecting to payment…" : "Checkout"}
            </button>
          </form>
        ) : (
          <Link
            href="/login?next=/cart"
            className="rounded-md bg-amber-500 px-6 py-3 font-semibold text-slate-900 hover:bg-amber-400"
          >
            Sign in with your phone to check out
          </Link>
        )}
      </div>
    </div>
  );
}
