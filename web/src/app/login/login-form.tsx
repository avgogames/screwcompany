"use client";

import { useActionState } from "react";
import { postJson } from "@/lib/client-api";

type LoginState =
  | { step: "phone"; error?: string }
  | { step: "code"; phone: string; error?: string }
  | { step: "profile"; phone: string; error?: string };

type VerifyResult = { status: "signed_in" } | { status: "needs_profile"; phone: string };

async function loginAction(prev: LoginState, formData: FormData): Promise<LoginState> {
  const intent = formData.get("intent");
  const next = String(formData.get("next") ?? "/account");
  try {
    if (intent === "send" || intent === "resend") {
      const phone = intent === "resend" && prev.step !== "phone" ? prev.phone : String(formData.get("phone") ?? "");
      const res = await postJson<{ phone: string }>("/api/auth/send-code", { phone });
      return { step: "code", phone: res.phone };
    }
    if (intent === "verify" && prev.step === "code") {
      const res = await postJson<VerifyResult>("/api/auth/verify", {
        phone: prev.phone,
        code: String(formData.get("code") ?? "").trim(),
      });
      if (res.status === "needs_profile") return { step: "profile", phone: prev.phone };
      window.location.assign(next);
      return prev;
    }
    if (intent === "register" && prev.step === "profile") {
      await postJson("/api/auth/register", {
        name: String(formData.get("name") ?? ""),
        company: String(formData.get("company") ?? "") || undefined,
      });
      window.location.assign(next);
      return prev;
    }
  } catch (e) {
    const error = e instanceof Error ? e.message : "Something went wrong.";
    if (intent === "register" && error.includes("expired")) return { step: "phone", error };
    return { ...prev, error };
  }
  return { step: "phone" };
}

const input = "mt-1 w-full rounded-md border border-slate-300 px-3 py-2.5 focus:border-amber-500 focus:outline-none";
const button =
  "w-full rounded-md bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-700 disabled:opacity-60";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, { step: "phone" });

  return (
    <form action={action} className="mt-8 space-y-4 rounded-lg border border-slate-200 bg-white p-6">
      <input type="hidden" name="next" value={next} />

      {state.step === "phone" && (
        <>
          <label className="block text-sm font-medium">
            Mobile phone number
            <input
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="+1 555 123 4567"
              required
              className={input}
            />
          </label>
          <button name="intent" value="send" disabled={pending} className={button}>
            {pending ? "Sending…" : "Send code"}
          </button>
        </>
      )}

      {state.step === "code" && (
        <>
          <p className="text-sm text-slate-600">
            Enter the code we sent to <span className="font-semibold">{state.phone}</span>.
          </p>
          <label className="block text-sm font-medium">
            Verification code
            <input
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              required
              autoFocus
              className={`${input} tracking-widest`}
            />
          </label>
          <button name="intent" value="verify" disabled={pending} className={button}>
            {pending ? "Checking…" : "Verify"}
          </button>
          <button
            name="intent"
            value="resend"
            formNoValidate
            disabled={pending}
            className="w-full text-sm text-slate-500 hover:underline"
          >
            Resend code
          </button>
        </>
      )}

      {state.step === "profile" && (
        <>
          <p className="text-sm text-slate-600">
            <span className="font-semibold">{state.phone}</span> is verified. Tell us a bit about you to finish
            registering.
          </p>
          <label className="block text-sm font-medium">
            Full name
            <input name="name" autoComplete="name" required minLength={2} autoFocus className={input} />
          </label>
          <label className="block text-sm font-medium">
            Company <span className="font-normal text-slate-400">(optional)</span>
            <input name="company" autoComplete="organization" className={input} />
          </label>
          <button name="intent" value="register" disabled={pending} className={button}>
            {pending ? "Creating account…" : "Create account"}
          </button>
        </>
      )}

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
