-- Run after Better Auth's own migration has created the "user" table
-- (npx @better-auth/cli migrate), so the FKs below resolve. See README.

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  image_url TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'general',
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Guest-cart rows, keyed by the anonymous "app_session" cookie (see server/session.ts).
-- Deliberately no FK to the auth user table: a cart is built before sign-in and only
-- gets attached to a user at checkout, when its rows are converted into an order.
CREATE TABLE IF NOT EXISTS cart_items (
  id SERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, product_id)
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'placed' CHECK (status IN ('placed', 'cancelled')),
  total NUMERIC(10, 2) NOT NULL,
  -- Dummy-payment fields: never store a full card number or CVC, only what a real
  -- receipt would show (brand + last 4) plus a fake transaction id.
  transaction_id TEXT NOT NULL DEFAULT '',
  card_brand TEXT NOT NULL DEFAULT '',
  card_last4 TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Idempotent for databases that already had an orders table before payment fields existed.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS transaction_id TEXT NOT NULL DEFAULT '';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS card_brand TEXT NOT NULL DEFAULT '';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS card_last4 TEXT NOT NULL DEFAULT '';

-- Snapshot product_name/unit_price at order time so a later price change or product
-- edit never retroactively alters a past order's record.
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id),
  product_name TEXT NOT NULL,
  unit_price NUMERIC(10, 2) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0)
);

-- Audit log for admin stock changes. delta is signed: positive for restocks, negative for
-- corrections/shrinkage/damage. The running stock_quantity on products is the source of truth
-- for "how much is available"; this table is the history of how it got there.
CREATE TABLE IF NOT EXISTS stock_adjustments (
  id SERIAL PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  delta INTEGER NOT NULL CHECK (delta <> 0),
  resulting_quantity INTEGER NOT NULL,
  reason TEXT NOT NULL DEFAULT '',
  admin_user_id TEXT NOT NULL REFERENCES "user"(id),
  admin_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cart_items_session ON cart_items (session_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders (user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_stock_adjustments_product ON stock_adjustments (product_id);
