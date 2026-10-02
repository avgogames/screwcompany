import type { Metadata } from "next";
import { ProductCard } from "@/components/product-card";
import { api } from "@/lib/api";

export const metadata: Metadata = { title: "Products" };

export default async function ProductsPage() {
  const products = await api.products();
  const categories = [...new Set(products.map((p) => p.category))];
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold">Products</h1>
      <p className="mt-2 text-slate-600">Stock parts ship within 2 business days. Volume pricing available on request.</p>
      {categories.map((cat) => (
        <section key={cat} className="mt-10">
          <h2 className="mb-4 text-xl font-semibold">{cat}</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products
              .filter((p) => p.category === cat)
              .map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
