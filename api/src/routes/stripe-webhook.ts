import type { FastifyPluginAsync } from "fastify";
import type Stripe from "stripe";
import { db } from "../lib/db.js";
import { markOrderPaid } from "../lib/orders.js";
import { getStripe } from "../lib/stripe.js";

export const stripeWebhookRoutes: FastifyPluginAsync = async (app) => {
  // Stripe signatures are computed over the raw body, so keep it as a string in this plugin only.
  app.addContentTypeParser("application/json", { parseAs: "string" }, (_req, body, done) => done(null, body));

  app.post("/webhook", async (request, reply) => {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    const signature = request.headers["stripe-signature"];
    if (!secret || typeof signature !== "string") return reply.code(400).send({ error: "Webhook not configured" });

    let event: Stripe.Event;
    try {
      event = getStripe().webhooks.constructEvent(request.body as string, signature, secret);
    } catch (e) {
      request.log.warn(e, "invalid stripe webhook");
      return reply.code(400).send({ error: "Invalid signature" });
    }

    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
        await markOrderPaid(event.data.object);
        break;
      case "checkout.session.expired":
      case "checkout.session.async_payment_failed":
        await db.order.updateMany({
          where: { stripeSessionId: event.data.object.id, status: "pending" },
          data: { status: "canceled" },
        });
        break;
    }
    return { received: true };
  });
};
