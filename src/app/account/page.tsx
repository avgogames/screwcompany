import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/products";
import { getCurrentUser } from "@/lib/session";
import { logoutAction } from "../login/actions";

export const metadata: Metadata = { title: "Account" };

const statusStyle: Record<string, string> = {
  paid: "bg-green-100 text-green-800",
  pending: "bg-amber-100 text-amber-800",
  canceled: "bg-slate-200 text-slate-600",
};

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");

  const orders = await db.order.findMany({
    where: { userId: user.id, NOT: { status: "canceled" } },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Hello, {user.name}</h1>
          <p className="mt-1 text-slate-600">
            {user.phone}
            {user.company && ` · ${user.company}`}
          </p>
        </div>
        <form action={logoutAction}>
          <button className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100">Sign out</button>
        </form>
      </div>

      <h2 className="mt-10 text-xl font-semibold">Your orders</h2>
      {orders.length === 0 ? (
        <p className="mt-4 text-slate-600">No orders yet.</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {orders.map((o) => (
            <li key={o.id} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-sm">{o.id}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyle[o.status] ?? ""}`}>
                  {o.status}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500">{o.createdAt.toLocaleDateString("en-US")}</p>
              <ul className="mt-3 text-sm">
                {o.items.map((i) => (
                  <li key={i.id}>
                    {i.quantity} × {i.name}
                  </li>
                ))}
              </ul>
              <p className="mt-3 font-semibold">{formatPrice(o.totalCents)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
