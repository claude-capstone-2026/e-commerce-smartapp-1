# Smartapp Store

Fullstack e-commerce app: React + Vite + TypeScript frontend, Express + Postgres backend,
Better Auth for auth, built to run as a single process (Express serves the built frontend and
the API on one port).

## Domain shape

- **Products** carry a tracked `stock_quantity`. Checkout is the "reserve a finite resource"
  operation: it locks every product row involved (`SELECT ... FOR UPDATE`), verifies stock under
  lock, decrements it, and writes the order in one transaction — so two concurrent checkouts can
  never oversell the same product.
- **Cart** is anonymous until checkout: an `app_session` cookie identifies a guest's cart
  (`cart_items` table), separate from the Better Auth session. Sign-in is only required at
  checkout, when the cart is converted into an order owned by the signed-in user.
- **Orders** snapshot `product_name`/`unit_price` at purchase time, so a later price change or
  product edit never alters a past order.

## Setup

1. Copy `.env.example` to `.env` and fill in `DATABASE_URL` (a Neon Postgres connection string)
   and `BETTER_AUTH_SECRET` (any long random string).
2. Install dependencies:
   ```
   npm install
   ```
3. Run Better Auth's own migration first (creates the `user`/`session`/etc. tables that the app
   schema's `orders.user_id` foreign key depends on), then the app schema + seed data:
   ```
   npx @better-auth/cli migrate
   npm run migrate
   ```
4. Start the dev servers (Vite on 5173 proxying `/api` to Express on 3001):
   ```
   npm run dev
   ```

## Build & run as a single process

```
npm run build
npm start
```

`npm start` serves the built frontend from `dist/client` and the API from the same Express
process on `$PORT` (default 3001).

## Deployment

Not yet deployed — this is a local scaffold. See the `build-fullstack-react-app` skill's
`references/deployment-render.md` when ready to deploy to Render.
