import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { db } from "../lib/db.js";
import { markOrderPaid } from "../lib/orders.js";
import { getProduct } from "../lib/products.js";
import { getCurrentUser } from "../lib/session.js";
import { getStripe, siteUrl } from "../lib/stripe.js";

const CheckoutBody = z.object({
  items: z
    .array(z.object({ productId: z.string(), quantity: z.number().int().min(1).max(10_000) }))
    .min(1)
    .max(100),
});

export const orderRoutes: FastifyPluginAsync = async (app) => {
  app.get("/orders", async (request, reply) => {
    const user = await getCurrentUser(request);
    if (!user) return reply.code(401).send({ error: "Not signed in" });
    return db.order.findMany({
      where: { userId: user.id, NOT: { status: "canceled" } },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });
  });

  app.post("/checkout", async (request, reply) => {
    const user = await getCurrentUser(request);
    if (!user) return reply.code(401).send({ error: "Please sign in to check out." });

    const body = CheckoutBody.safeParse(request.body);
    if (!body.success) return reply.code(400).send({ error: "Your cart is empty or invalid." });

    // Prices always come from the server-side catalog, never from the browser.
    const items = [];
    for (const line of body.data.items) {
      const product = getProduct(line.productId);
      if (!product)
        return reply.code(400).send({ error: "An item in your cart is no longer available. Please remove it and try again." });
      if (line.quantity < product.minQty)
        return reply.code(400).send({ error: `${product.name} has a minimum order of ${product.minQty}.` });
      items.push({ product, quantity: line.quantity });
    }
    const totalCents = items.reduce((sum, i) => sum + i.product.priceCents * i.quantity, 0);

    let stripe;
    try {
      stripe = getStripe();
    } catch {
      return reply.code(503).send({ error: "Payments are not configured yet. Add STRIPE_SECRET_KEY to the API environment." });
    }

    const order = await db.order.create({
      data: {
        userId: user.id,
        totalCents,
        items: {
          create: items.map((i) => ({
            productId: i.product.id,
            name: i.product.name,
            unitPriceCents: i.product.priceCents,
            quantity: i.quantity,
          })),
        },
      },
    });

    try {
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        client_reference_id: order.id,
        metadata: { orderId: order.id, userId: user.id },
        line_items: items.map((i) => ({
          quantity: i.quantity,
          price_data: {
            currency: "usd",
            unit_amount: i.product.priceCents,
            product_data: { name: i.product.name, metadata: { productId: i.product.id } },
          },
        })),
        shipping_address_collection: { allowed_countries: ["US", "CA"] },
        success_url: `${siteUrl()}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${siteUrl()}/checkout/cancel`,
      });
      await db.order.update({ where: { id: order.id }, data: { stripeSessionId: session.id } });
      if (!session.url) throw new Error("Stripe returned no checkout URL");
      return { url: session.url };
    } catch (e) {
      request.log.error(e, "stripe session failed");
      await db.order.update({ where: { id: order.id }, data: { status: "canceled" } });
      return reply.code(502).send({ error: "We couldn't start checkout. Please try again." });
    }
  });

  // Called by the success page. The webhook is the source of truth; this also confirms
  // payment right away in case the webhook hasn't arrived yet.
  app.get<{ Querystring: { session_id?: string } }>("/checkout/confirm", async (request, reply) => {
    const user = await getCurrentUser(request);
    if (!user) return reply.code(401).send({ error: "Not signed in" });
    const sessionId = request.query.session_id;
    if (!sessionId) return reply.code(400).send({ error: "Missing session_id" });

    const order = await db.order.findFirst({ where: { stripeSessionId: sessionId, userId: user.id } });
    if (!order) return reply.code(404).send({ error: "Order not found" });
    try {
      await markOrderPaid(await getStripe().checkout.sessions.retrieve(sessionId));
    } catch (e) {
      request.log.error(e, "could not confirm session");
    }
    return db.order.findUnique({ where: { id: order.id }, include: { items: true } });
  });
};
