import Link from "next/link";
import { formatPrice, type Product } from "@/lib/products";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-amber-500 hover:shadow"
    >
      <div className="mb-4 flex aspect-[4/3] items-center justify-center rounded-md bg-gradient-to-br from-slate-200 to-slate-300 text-4xl text-slate-500">
        ⚙
      </div>
      <span className="text-xs font-semibold uppercase tracking-wide text-amber-600">{product.category}</span>
      <h3 className="mt-1 font-semibold group-hover:text-amber-700">{product.name}</h3>
      <p className="mt-2 line-clamp-2 text-sm text-slate-600">{product.description}</p>
      <p className="mt-auto pt-4 font-semibold">
        {formatPrice(product.priceCents)} <span className="text-sm font-normal text-slate-500">/ {product.unit}</span>
      </p>
    </Link>
  );
}
