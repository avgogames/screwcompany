"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { getProduct } from "@/lib/products";
import { getCurrentUser } from "@/lib/session";
import { getStripe, siteUrl } from "@/lib/stripe";

const CartSchema = z
  .array(z.object({ productId: z.string(), quantity: z.number().int().min(1).max(10_000) }))
  .min(1)
  .max(100);

export type CheckoutState = { error?: string };

export async function checkoutAction(_prev: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/cart");

  let lines: z.infer<typeof CartSchema>;
  try {
    lines = CartSchema.parse(JSON.parse(String(formData.get("cart") ?? "[]")));
  } catch {
    return { error: "Your cart is empty or invalid." };
  }

  // Prices always come from the server-side catalog, never from the browser.
  const items = [];
  for (const line of lines) {
    const product = getProduct(line.productId);
    if (!product) return { error: "An item in your cart is no longer available. Please remove it and try again." };
    if (line.quantity < product.minQty)
      return { error: `${product.name} has a minimum order of ${product.minQty}.` };
    items.push({ product, quantity: line.quantity });
  }
  const totalCents = items.reduce((sum, i) => sum + i.product.priceCents * i.quantity, 0);

  let stripe;
  try {
    stripe = getStripe();
  } catch {
    return { error: "Payments are not configured yet. Add STRIPE_SECRET_KEY to the environment." };
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

  let url: string | null;
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
    url = session.url;
  } catch (e) {
    console.error("[checkout] stripe session failed", e);
    await db.order.update({ where: { id: order.id }, data: { status: "canceled" } });
    return { error: "We couldn't start checkout. Please try again." };
  }

  if (!url) return { error: "We couldn't start checkout. Please try again." };
  redirect(url);
}
