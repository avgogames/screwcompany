import type { Metadata } from "next";
import Link from "next/link";
import { Geist } from "next/font/google";
import { CartProvider } from "@/components/cart-context";
import { CartBadge } from "@/components/cart-badge";
import { api } from "@/lib/api";
import { COMPANY } from "@/lib/company";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: COMPANY.name, template: `%s | ${COMPANY.name}` },
  description: COMPANY.tagline,
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await api.me();

  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-slate-50 text-slate-900">
        <CartProvider>
          <header className="bg-slate-900 text-white">
            <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3">
              <Link href="/" className="text-lg font-bold tracking-tight">
                <span className="text-amber-500">■</span> {COMPANY.name}
              </Link>
              <div className="flex items-center gap-1 text-sm">
                <Link href="/products" className="rounded-md px-3 py-2 hover:bg-white/10">
                  Products
                </Link>
                <Link href={user ? "/account" : "/login"} className="rounded-md px-3 py-2 hover:bg-white/10">
                  {user ? "Account" : "Sign in"}
                </Link>
                <CartBadge />
              </div>
            </nav>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="border-t border-slate-200 bg-white">
            <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-2 px-4 py-6 text-sm text-slate-500">
              <span>
                © {new Date().getFullYear()} {COMPANY.name}
              </span>
              <span>
                {COMPANY.email} · {COMPANY.phone}
              </span>
            </div>
          </footer>
        </CartProvider>
      </body>
    </html>
  );
}
