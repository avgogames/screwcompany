"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { normalizePhone } from "@/lib/phone";
import { checkVerificationCode, sendVerificationCode } from "@/lib/sms";
import {
  clearVerifiedPhone,
  consumeVerifiedPhone,
  createSession,
  destroySession,
  setVerifiedPhone,
} from "@/lib/session";

export type LoginState =
  | { step: "phone"; error?: string }
  | { step: "code"; phone: string; error?: string }
  | { step: "profile"; phone: string; error?: string };

function safeNext(next: FormDataEntryValue | null): string {
  const n = typeof next === "string" ? next : "";
  return n.startsWith("/") && !n.startsWith("//") ? n : "/account";
}

export async function loginAction(prev: LoginState, formData: FormData): Promise<LoginState> {
  const intent = formData.get("intent");
  const next = safeNext(formData.get("next"));

  if (intent === "send" || intent === "resend") {
    const raw = intent === "resend" && prev.step !== "phone" ? prev.phone : String(formData.get("phone") ?? "");
    const phone = normalizePhone(raw);
    if (!phone) return { step: "phone", error: "Enter a valid phone number, including country code if outside the US." };
    try {
      await sendVerificationCode(phone);
    } catch (e) {
      console.error("[login] send code failed", e);
      return { step: "phone", error: "We couldn't send a code to that number. Please try again." };
    }
    return { step: "code", phone };
  }

  if (intent === "verify" && prev.step === "code") {
    const code = String(formData.get("code") ?? "").trim();
    if (!/^\d{4,10}$/.test(code)) return { ...prev, error: "Enter the code from the SMS." };
    let ok = false;
    try {
      ok = await checkVerificationCode(prev.phone, code);
    } catch (e) {
      console.error("[login] check code failed", e);
    }
    if (!ok) return { ...prev, error: "That code is incorrect or expired." };

    const user = await db.user.findUnique({ where: { phone: prev.phone } });
    if (user) {
      await createSession(user.id);
      redirect(next);
    }
    await setVerifiedPhone(prev.phone);
    return { step: "profile", phone: prev.phone };
  }

  if (intent === "register" && prev.step === "profile") {
    const parsed = z
      .object({ name: z.string().trim().min(2).max(100), company: z.string().trim().max(120).optional() })
      .safeParse({ name: formData.get("name"), company: formData.get("company") || undefined });
    if (!parsed.success) return { ...prev, error: "Please enter your full name." };

    const phone = await consumeVerifiedPhone();
    if (!phone || phone !== prev.phone) return { step: "phone", error: "Your verification expired. Please start again." };

    const user = await db.user.upsert({
      where: { phone },
      update: {},
      create: { phone, name: parsed.data.name, company: parsed.data.company },
    });
    await clearVerifiedPhone();
    await createSession(user.id);
    redirect(next);
  }

  return { step: "phone" };
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}
