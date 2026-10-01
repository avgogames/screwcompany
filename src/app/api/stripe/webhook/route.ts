import type Stripe from "stripe";
import { db } from "@/lib/db";
import { markOrderPaid } from "@/lib/orders";
import { getStripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!secret || !signature) return new Response("Webhook not configured", { status: 400 });

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(await request.text(), signature, secret);
  } catch (e) {
    console.error("[stripe] invalid webhook", e);
    return new Response("Invalid signature", { status: 400 });
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

  return Response.json({ received: true });
}
