import { SignJWT, jwtVerify } from "jose";
import type { FastifyReply, FastifyRequest } from "fastify";
import { db } from "./db.js";

const SESSION_COOKIE = "session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

// A short-lived signed cookie proving a phone number was just verified,
// used to finish registration for new users without re-sending a code.
const PENDING_COOKIE = "verified_phone";
const PENDING_MAX_AGE = 60 * 10;

const isProd = process.env.NODE_ENV === "production";

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) {
    if (isProd) throw new Error("SESSION_SECRET must be set (32+ chars)");
    return new TextEncoder().encode("dev-only-insecure-session-secret-change-me");
  }
  return new TextEncoder().encode(s);
}

const cookieOptions = (maxAge: number) => ({
  httpOnly: true,
  secure: isProd,
  sameSite: "lax" as const,
  path: "/",
  maxAge,
});

async function sign(payload: Record<string, unknown>, maxAge: number) {
  return new SignJWT(payload).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime(`${maxAge}s`).sign(secret());
}

async function verify(token: string | undefined) {
  if (!token) return null;
  try {
    return (await jwtVerify(token, secret())).payload;
  } catch {
    return null;
  }
}

export async function createSession(reply: FastifyReply, userId: string) {
  reply.setCookie(SESSION_COOKIE, await sign({ sub: userId }, SESSION_MAX_AGE), cookieOptions(SESSION_MAX_AGE));
}

export function destroySession(reply: FastifyReply) {
  reply.clearCookie(SESSION_COOKIE, { path: "/" });
}

export async function getCurrentUser(request: FastifyRequest) {
  const payload = await verify(request.cookies[SESSION_COOKIE]);
  if (!payload?.sub) return null;
  return db.user.findUnique({ where: { id: payload.sub } });
}

export async function setVerifiedPhone(reply: FastifyReply, phone: string) {
  reply.setCookie(PENDING_COOKIE, await sign({ phone }, PENDING_MAX_AGE), cookieOptions(PENDING_MAX_AGE));
}

export async function getVerifiedPhone(request: FastifyRequest): Promise<string | null> {
  const payload = await verify(request.cookies[PENDING_COOKIE]);
  return typeof payload?.phone === "string" ? payload.phone : null;
}

export function clearVerifiedPhone(reply: FastifyReply) {
  reply.clearCookie(PENDING_COOKIE, { path: "/" });
}
