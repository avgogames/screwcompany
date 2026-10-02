import Link from "next/link";
import { redirect } from "next/navigation";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { ClearCart } from "./clear-cart";

export default async function SuccessPage({ searchParams }: PageProps<"/checkout/success">) {
  const user = await api.me();
  if (!user) redirect("/login");
  const { session_id } = await searchParams;
  if (typeof session_id !== "string") redirect("/account");

  const order = await api.confirmCheckout(session_id);
  if (!order) redirect("/account");

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <ClearCart />
      <h1 className="text-3xl font-bold">Thank you for your order!</h1>
      <p className="mt-3 text-slate-600">
        Order <span className="font-mono">{order.id}</span> is{" "}
        <span className="font-semibold">{order.status === "paid" ? "paid" : "being confirmed"}</span>. We&apos;ll text
        you when it ships.
      </p>
      <ul className="mx-auto mt-8 max-w-md divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white text-left">
        {order.items.map((i) => (
          <li key={i.id} className="flex justify-between p-3 text-sm">
            <span>
              {i.quantity} × {i.name}
            </span>
            <span>{formatPrice(i.unitPriceCents * i.quantity)}</span>
          </li>
        ))}
        <li className="flex justify-between p-3 font-semibold">
          <span>Subtotal</span>
          <span>{formatPrice(order.totalCents)}</span>
        </li>
      </ul>
      <Link href="/account" className="mt-8 inline-block font-semibold text-amber-700 hover:underline">
        View your orders →
      </Link>
    </div>
  );
}
