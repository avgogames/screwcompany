import cookie from "@fastify/cookie";
import Fastify from "fastify";
import { authRoutes } from "./routes/auth.js";
import { orderRoutes } from "./routes/orders.js";
import { productRoutes } from "./routes/products.js";
import { stripeWebhookRoutes } from "./routes/stripe-webhook.js";

export function buildApp() {
  const app = Fastify({ logger: { level: process.env.LOG_LEVEL ?? "info" }, trustProxy: true });

  app.register(cookie);
  app.get("/health", async () => ({ ok: true }));
  app.register(authRoutes, { prefix: "/api/auth" });
  app.register(productRoutes, { prefix: "/api/products" });
  app.register(orderRoutes, { prefix: "/api" });
  app.register(stripeWebhookRoutes, { prefix: "/api/stripe" });

  return app;
}
