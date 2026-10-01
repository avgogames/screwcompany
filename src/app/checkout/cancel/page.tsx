import Link from "next/link";

export default function CancelPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <h1 className="text-3xl font-bold">Checkout canceled</h1>
      <p className="mt-3 text-slate-600">No payment was taken. Your cart is still saved.</p>
      <Link href="/cart" className="mt-8 inline-block font-semibold text-amber-700 hover:underline">
        Back to cart →
      </Link>
    </div>
  );
}
