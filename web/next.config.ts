import type { NextConfig } from "next";

const apiUrl = (process.env.API_URL ?? "http://localhost:4000").replace(/\/$/, "");

const nextConfig: NextConfig = {
  // Standalone output keeps the production container small.
  output: "standalone",
  // web/ is its own app; don't let Next treat the repo root as the workspace.
  outputFileTracingRoot: process.cwd(),
  turbopack: { root: process.cwd() },
  // The browser only ever talks to this site. Requests to /api/* are proxied to the API service,
  // so its session cookies are first-party and no CORS setup is needed.
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${apiUrl}/api/:path*` }];
  },
};

export default nextConfig;
