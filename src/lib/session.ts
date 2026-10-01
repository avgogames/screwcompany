import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

const COOKIE = "session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) {
    if (process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET must be set (32+ chars)");
    return new TextEncoder().encode("dev-only-insecure-session-secret-change-me");
  }
  return new TextEncoder().encode(s);
}

export async function createSession(userId: string) {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

export async function getCurrentUser() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub) return null;
    return await db.user.findUnique({ where: { id: payload.sub } });
  } catch {
    return null;
  }
}

// A short-lived signed cookie proving a phone number was just verified,
// used to finish registration for new users without re-sending a code.
const PENDING_COOKIE = "verified_phone";
const PENDING_MAX_AGE = 60 * 10;

export async function setVerifiedPhone(phone: string) {
  const token = await new SignJWT({ phone })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(`${PENDING_MAX_AGE}s`)
    .sign(secret());
  (await cookies()).set(PENDING_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: PENDING_MAX_AGE,
  });
}

export async function consumeVerifiedPhone(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(PENDING_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return typeof payload.phone === "string" ? payload.phone : null;
  } catch {
    return null;
  }
}

export async function clearVerifiedPhone() {
  (await cookies()).delete(PENDING_COOKIE);
}
