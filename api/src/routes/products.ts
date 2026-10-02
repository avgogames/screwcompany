import type { FastifyPluginAsync } from "fastify";
import { getProduct, products } from "../lib/products.js";

export const productRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", async () => products);

  app.get<{ Params: { slug: string } }>("/:slug", async (request, reply) => {
    const product = getProduct(request.params.slug);
    if (!product) return reply.code(404).send({ error: "Product not found" });
    return product;
  });
};
