# Ironworks Manufacturing storefront

A website for a manufacturing company, split into two services plus a database:

| Folder | Service | What it does |
| --- | --- | --- |
| `web/` | Website (Next.js + React, port 3000) | Pages, cart, sign-in and checkout screens. Holds no secrets and never touches the database. |
| `api/` | API (Node.js + Fastify, port 4000) | Phone sign-up (Twilio Verify), sessions, product catalog, orders, Stripe checkout and webhook. Owns the database. |
| `compose.yaml` | Postgres (port 5433) | Database, plus containers for both services. |

The browser only talks to the website. Requests to `/api/*` on the website are proxied to the API service, so the
API's login cookies work without any cross-site setup. Server-rendered pages call the API directly and forward the
visitor's cookies.

## Run it locally

You need Node.js 20+ and [Podman](https://podman.io/docs/installation) with `podman-compose`
(`pip install podman-compose`). On macOS and Windows, run `podman machine init && podman machine start` once first.

```bash
npm run setup                         # installs root, api/ and web/ dependencies
podman compose up -d db               # starts Postgres on localhost:5433
cp api/.env.example api/.env
cp web/.env.example web/.env.local
npm run db:migrate                    # creates the tables
npm run dev                           # starts the API (4000) and website (3000) together
```

Open http://localhost:3000. With the Twilio variables left empty in `api/.env`, any phone number is accepted with the
code **123456** (also printed in the API log). This fallback is disabled when `NODE_ENV=production`.

Postgres listens on port **5433** rather than the usual 5432, so it can't collide with a Postgres installed directly on
your computer. To query it: `podman compose exec db psql -U postgres -d screwcompany`.

### Everything in containers

```bash
cp .env.example .env                  # optional: Stripe/Twilio keys for the API container
podman compose up -d --build          # Postgres + API + website
```

The API container applies database migrations when it starts. Open http://localhost:3000.

## Environment variables

Use **test** credentials and never commit real secrets.

**API (`api/.env`)**

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres connection string, e.g. `postgresql://user:password@host:5432/dbname` |
| `PORT` | Port the API listens on (default 4000) |
| `SITE_URL` | Public URL of the website, used for Stripe redirect URLs |
| `SESSION_SECRET` | Signs the login session cookie. Required in production, 32+ random characters (`openssl rand -hex 32`) |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` | Twilio account credentials |
| `TWILIO_VERIFY_SERVICE_SID` | A Twilio Verify service (Console → Verify → Services) |
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | Signing secret for the webhook endpoint (`whsec_...`) |

**Website (`web/.env.local`)**

| Variable | Purpose |
| --- | --- |
| `API_URL` | Where the website reaches the API, e.g. `http://localhost:4000`. Also needed at build time, because the `/api` proxy is baked into the build. |

### Twilio setup

1. Create a Verify service in the [Twilio Console](https://console.twilio.com/us1/develop/verify/services).
2. Copy the Account SID, Auth Token and the service SID (`VA...`) into `api/.env`.
3. On a trial account, Twilio only sends SMS to verified numbers.

### Stripe setup

1. Copy your test secret key from the [Stripe dashboard](https://dashboard.stripe.com/test/apikeys) into `api/.env`.
2. For local webhooks, install the Stripe CLI and run
   `stripe listen --forward-to localhost:4000/api/stripe/webhook`,
   then put the printed `whsec_...` into `STRIPE_WEBHOOK_SECRET`.
3. In production, add a webhook endpoint for `https://your-domain/api/stripe/webhook` with the events
   `checkout.session.completed`, `checkout.session.async_payment_succeeded`,
   `checkout.session.async_payment_failed` and `checkout.session.expired`.
4. Pay with the test card `4242 4242 4242 4242`, any future date and any CVC.

## API endpoints

| Method and path | Purpose |
| --- | --- |
| `POST /api/auth/send-code` | Send an SMS code to `{ phone }` |
| `POST /api/auth/verify` | Check `{ phone, code }`. Signs in existing users, otherwise returns `needs_profile` |
| `POST /api/auth/register` | Finish registration with `{ name, company? }` after a verified code |
| `POST /api/auth/logout` | Clear the session |
| `GET /api/auth/me` | The signed-in user (401 if none) |
| `GET /api/products`, `GET /api/products/:slug` | Product catalog |
| `GET /api/orders` | The signed-in user's orders |
| `POST /api/checkout` | Create an order from `{ items: [{ productId, quantity }] }` and return a Stripe Checkout `url` |
| `GET /api/checkout/confirm?session_id=` | Confirm payment after Stripe redirects back |
| `POST /api/stripe/webhook` | Stripe webhook (marks orders paid or canceled) |
| `GET /health` | Health check |

Prices always come from the API's catalog (`api/src/lib/products.ts`), never from the browser.

## Deploying

Deploy the two services separately (each folder has a `Containerfile`):

- **API:** set the API variables above with `NODE_ENV=production`, a hosted Postgres `DATABASE_URL` and a
  `SESSION_SECRET`. The container runs `prisma migrate deploy` on start.
- **Website:** build with `--build-arg API_URL=<the API's internal URL>` and set the same `API_URL` at runtime.
  Only the website needs to be public; point the Stripe webhook at `https://your-site/api/stripe/webhook`.

## Customizing

- Company name and contact details: `web/src/lib/company.ts`
- Products and prices: `api/src/lib/products.ts`

## Scripts (from the repo root)

| Command | What it does |
| --- | --- |
| `npm run setup` | Installs dependencies for the root, `api/` and `web/` |
| `npm run dev` | Runs the API and website in development mode |
| `npm run build` | Builds both services |
| `npm run typecheck` | Type-checks both services |
| `npm run lint` | Lints the website |
| `npm run db:migrate` | Applies migrations and creates new ones after you edit `api/prisma/schema.prisma` |
