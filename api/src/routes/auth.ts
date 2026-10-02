import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { db } from "../lib/db.js";
import { normalizePhone } from "../lib/phone.js";
import {
  clearVerifiedPhone,
  createSession,
  destroySession,
  getCurrentUser,
  getVerifiedPhone,
  setVerifiedPhone,
} from "../lib/session.js";
import { checkVerificationCode, sendVerificationCode } from "../lib/sms.js";

const PhoneBody = z.object({ phone: z.string().max(40) });
const VerifyBody = z.object({ phone: z.string().max(40), code: z.string().regex(/^\d{4,10}$/) });
const RegisterBody = z.object({
  name: z.string().trim().min(2).max(100),
  company: z.string().trim().max(120).optional(),
});

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post("/send-code", async (request, reply) => {
    const body = PhoneBody.safeParse(request.body);
    const phone = body.success ? normalizePhone(body.data.phone) : null;
    if (!phone) return reply.code(400).send({ error: "Enter a valid phone number, including country code if outside the US." });
    try {
      await sendVerificationCode(phone);
    } catch (e) {
      request.log.error(e, "send code failed");
      return reply.code(502).send({ error: "We couldn't send a code to that number. Please try again." });
    }
    return { phone };
  });

  app.post("/verify", async (request, reply) => {
    const body = VerifyBody.safeParse(request.body);
    const phone = body.success ? normalizePhone(body.data.phone) : null;
    if (!body.success || !phone) return reply.code(400).send({ error: "Enter the code from the SMS." });

    let ok = false;
    try {
      ok = await checkVerificationCode(phone, body.data.code);
    } catch (e) {
      request.log.error(e, "check code failed");
    }
    if (!ok) return reply.code(400).send({ error: "That code is incorrect or expired." });

    const user = await db.user.findUnique({ where: { phone } });
    if (user) {
      await createSession(reply, user.id);
      return { status: "signed_in", user };
    }
    await setVerifiedPhone(reply, phone);
    return { status: "needs_profile", phone };
  });

  app.post("/register", async (request, reply) => {
    const body = RegisterBody.safeParse(request.body);
    if (!body.success) return reply.code(400).send({ error: "Please enter your full name." });
    const phone = await getVerifiedPhone(request);
    if (!phone) return reply.code(401).send({ error: "Your verification expired. Please start again." });

    const user = await db.user.upsert({
      where: { phone },
      update: {},
      create: { phone, name: body.data.name, company: body.data.company || undefined },
    });
    clearVerifiedPhone(reply);
    await createSession(reply, user.id);
    return { status: "signed_in", user };
  });

  app.post("/logout", async (_request, reply) => {
    destroySession(reply);
    return { ok: true };
  });

  app.get("/me", async (request, reply) => {
    const user = await getCurrentUser(request);
    if (!user) return reply.code(401).send({ error: "Not signed in" });
    return user;
  });
};
