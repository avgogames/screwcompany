import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  const nextPath = typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : "/account";
  if (await getCurrentUser()) redirect(nextPath);

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-3xl font-bold">Sign in or register</h1>
      <p className="mt-2 text-slate-600">We&apos;ll text you a one-time code. New customers can register in the same step.</p>
      <LoginForm next={nextPath} />
    </div>
  );
}
