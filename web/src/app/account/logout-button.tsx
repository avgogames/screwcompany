"use client";

import { useRouter } from "next/navigation";
import { postJson } from "@/lib/client-api";

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await postJson("/api/auth/logout").catch(() => {});
        router.push("/");
        router.refresh();
      }}
      className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100"
    >
      Sign out
    </button>
  );
}
