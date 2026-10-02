import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCart } from "@/components/add-to-cart";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/format";

export async function generateMetadata({ params }: PageProps<"/products/[slug]">): Promise<Metadata> {
  const product = await api.product((await params).slug);
  return { title: product?.name ?? "Product not found" };
}

export default async function ProductPage({ params }: PageProps<"/products/[slug]">) {
  const product = await api.product((await params).slug);
  if (!product) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Link href="/products" className="text-sm text-slate-500 hover:underline">
        ← All products
      </Link>
      <div className="mt-6 grid gap-10 md:grid-cols-2">
        <div className="flex aspect-square items-center justify-center rounded-lg bg-gradient-to-br from-slate-200 to-slate-300 text-8xl text-slate-500">
          ⚙
        </div>
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-amber-600">{product.category}</span>
          <h1 className="mt-1 text-3xl font-bold">{product.name}</h1>
          <p className="mt-4 text-2xl font-semibold">
            {formatPrice(product.priceCents)} <span className="text-base font-normal text-slate-500">/ {product.unit}</span>
          </p>
          <p className="mt-4 text-slate-700">{product.description}</p>
          {product.minQty > 1 && <p className="mt-2 text-sm text-slate-500">Minimum order: {product.minQty} {product.unit}s</p>}
          <div className="mt-6">
            <AddToCart productId={product.id} minQty={product.minQty} />
          </div>
          <table className="mt-8 w-full text-sm">
            <tbody>
              {Object.entries(product.specs).map(([k, v]) => (
                <tr key={k} className="border-b border-slate-200">
                  <th className="py-2 pr-4 text-left font-medium text-slate-500">{k}</th>
                  <td className="py-2">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
