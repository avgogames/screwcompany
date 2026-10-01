# Ironworks Manufacturing storefront

A Next.js (App Router) + React website for a manufacturing company with:

- **Product catalog** (`src/lib/products.ts`) with category listing and product detail pages
- **Phone-number registration and sign-in** via SMS one-time codes (Twilio Verify)
- **Shopping cart** saved in the browser (localStorage)
- **Checkout** with Stripe Checkout, plus order history on the account page
- SQLite database through Prisma (swap to Postgres for production)

## Quick start

```bash
npm install
cp .env.example .env.local   # Next.js reads this
cp .env.example .env         # Prisma CLI reads this (only DATABASE_URL is needed)
npm run db:push              # creates prisma/dev.db
npm run dev
```

Open http://localhost:3000.

With the Twilio variables left empty in development, any phone number is accepted with the code **123456**
(the code is also printed in the server log). This fallback is disabled when `NODE_ENV=production`.

## Environment variables

All variables are listed in [`.env.example`](.env.example). Use **test** credentials; never commit real secrets.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Prisma connection string (`file:./dev.db` for SQLite) |
| `SESSION_SECRET` | Signs the login session cookie. Required in production, 32+ random characters (`openssl rand -hex 32`) |
| `NEXT_PUBLIC_SITE_URL` | Public site URL used for Stripe redirect URLs |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` | Twilio account credentials |
| `TWILIO_VERIFY_SERVICE_SID` | A Twilio Verify service (Console → Verify → Services) |
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | Signing secret for the webhook endpoint (`whsec_...`) |

### Twilio setup

1. Create a Verify service in the [Twilio Console](https://console.twilio.com/us1/develop/verify/services).
2. Copy the Account SID, Auth Token and the service SID (`VA...`) into `.env.local`.
3. On a trial account, Twilio only sends SMS to verified numbers.

### Stripe setup

1. Copy your test secret key from the [Stripe dashboard](https://dashboard.stripe.com/test/apikeys).
2. For local webhooks, install the Stripe CLI and run
   `stripe listen --forward-to localhost:3000/api/stripe/webhook`,
   then put the printed `whsec_...` into `STRIPE_WEBHOOK_SECRET`.
3. In production, add a webhook endpoint for `https://your-domain/api/stripe/webhook` with the events
   `checkout.session.completed`, `checkout.session.async_payment_succeeded`,
   `checkout.session.async_payment_failed` and `checkout.session.expired`.
4. Pay with the test card `4242 4242 4242 4242`, any future date and any CVC.

## How it works

- **Sign-in** (`src/app/login`): the user enters a phone number, which is normalized to E.164 and sent a code
  through Twilio Verify. After the code is approved, existing users are signed in; new users enter their name
  (and optional company) to finish registering. Sessions are signed JWTs in an httpOnly cookie (`src/lib/session.ts`).
- **Cart** (`src/components/cart-context.tsx`): stored client-side, so it survives page reloads and sign-in.
- **Checkout** (`src/app/checkout/actions.ts`): requires sign-in. Prices are always taken from the server-side
  catalog, an order is saved as `pending`, and the user is redirected to Stripe Checkout. The webhook
  (`src/app/api/stripe/webhook/route.ts`) marks it `paid`; the success page also confirms payment directly.

## Customizing

- Company name and contact details: `src/lib/company.ts`
- Products and prices: `src/lib/products.ts`
- Database: change the provider in `prisma/schema.prisma` to `postgresql` for production hosting
  (SQLite files don't persist on serverless platforms such as Vercel).

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Generates the Prisma client and builds for production |
| `npm run start` | Runs the production build |
| `npm run lint` | ESLint |
| `npm run db:push` | Syncs the Prisma schema to the database |
