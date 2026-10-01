import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { COMPANY } from "@/lib/company";
import { products } from "@/lib/products";

const capabilities = [
  { title: "CNC Machining", text: "3- and 5-axis milling and turning to ±0.02 mm." },
  { title: "Sheet Metal", text: "Laser cutting, bending and welding up to 20 mm." },
  { title: "Fasteners & Fittings", text: "Certified stock ready to ship the same day." },
  { title: "Quality Assured", text: "ISO 9001 processes with full material traceability." },
];

export default function Home() {
  return (
    <>
      <section className="bg-slate-900 text-white">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <p className="text-sm font-semibold uppercase tracking-widest text-amber-500">Built to spec. Built to last.</p>
          <h1 className="mt-3 max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">{COMPANY.name}</h1>
          <p className="mt-4 max-w-xl text-lg text-slate-300">{COMPANY.tagline}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/products" className="rounded-md bg-amber-500 px-5 py-3 font-semibold text-slate-900 hover:bg-amber-400">
              Shop products
            </Link>
            <Link href="/login" className="rounded-md border border-white/30 px-5 py-3 font-semibold hover:bg-white/10">
              Create an account
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
        {capabilities.map((c) => (
          <div key={c.title} className="rounded-lg border border-slate-200 bg-white p-5">
            <h3 className="font-semibold">{c.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{c.text}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-bold">Featured products</h2>
          <Link href="/products" className="text-sm font-semibold text-amber-700 hover:underline">
            View all →
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.slice(0, 3).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </>
  );
}
