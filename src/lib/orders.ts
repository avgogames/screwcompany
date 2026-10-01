import "server-only";
import type Stripe from "stripe";
import { db } from "@/lib/db";

/** Marks the order for a completed Checkout Session as paid. Safe to call more than once. */
export async function markOrderPaid(session: Stripe.Checkout.Session) {
  if (session.payment_status !== "paid") return;
  const orderId = session.metadata?.orderId ?? session.client_reference_id;
  if (!orderId) return;
  await db.order.updateMany({
    where: { id: orderId, stripeSessionId: session.id, status: { not: "paid" } },
    data: { status: "paid" },
  });
}
