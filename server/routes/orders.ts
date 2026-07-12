import { randomUUID } from "node:crypto";
import { Router } from "express";
import { pool, withTransaction, HttpError } from "../db/pool.js";
import { requireAuth } from "../auth.js";
import { processDummyPayment } from "../payment.js";

export const ordersRouter = Router();

ordersRouter.use(requireAuth);

async function loadOrders(userId: string) {
  const { rows: orders } = await pool.query(
    "SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC",
    [userId],
  );
  if (orders.length === 0) return [];

  const { rows: items } = await pool.query(
    `SELECT * FROM order_items WHERE order_id = ANY($1::text[])`,
    [orders.map((o) => o.id)],
  );

  return orders.map((o) => ({
    id: o.id,
    status: o.status,
    total: o.total,
    transactionId: o.transaction_id,
    cardBrand: o.card_brand,
    cardLast4: o.card_last4,
    createdAt: o.created_at,
    items: items
      .filter((i) => i.order_id === o.id)
      .map((i) => ({
        productId: i.product_id,
        name: i.product_name,
        unitPrice: i.unit_price,
        quantity: i.quantity,
      })),
  }));
}

ordersRouter.get("/mine", async (req, res) => {
  res.json(await loadOrders(req.user!.id));
});

ordersRouter.get("/:id", async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM orders WHERE id = $1", [req.params.id]);
  const order = rows[0];
  if (!order) throw new HttpError(404, "Order not found");
  if (order.user_id !== req.user!.id) throw new HttpError(403, "Not your order");

  const { rows: items } = await pool.query("SELECT * FROM order_items WHERE order_id = $1", [order.id]);
  res.json({
    id: order.id,
    status: order.status,
    total: order.total,
    transactionId: order.transaction_id,
    cardBrand: order.card_brand,
    cardLast4: order.card_last4,
    createdAt: order.created_at,
    items: items.map((i) => ({
      productId: i.product_id,
      name: i.product_name,
      unitPrice: i.unit_price,
      quantity: i.quantity,
    })),
  });
});

// Checkout: consumes the caller's guest cart (identified by req.sessionId, set by
// sessionMiddleware) and converts it into an order owned by the now-authenticated user.
// This is the capacity-based reservation pattern (see references/booking-domain.md Pattern B),
// applied to stock instead of a time slot: lock every involved product row, verify remaining
// stock under lock, decrement, then insert — all in one transaction so two simultaneous
// checkouts can never oversell the same product.
ordersRouter.post("/", async (req, res) => {
  const { rows: cartRows } = await pool.query(
    `SELECT ci.product_id, ci.quantity, p.name, p.price
     FROM cart_items ci
     JOIN products p ON p.id = ci.product_id
     WHERE ci.session_id = $1`,
    [req.sessionId],
  );
  if (cartRows.length === 0) throw new HttpError(400, "Cart is empty");

  // Validate the dummy card before touching stock at all — a bad card shouldn't lock rows.
  const { brand, last4 } = processDummyPayment(req.body);
  const transactionId = `TXN-${randomUUID().slice(0, 8).toUpperCase()}`;

  const orderId = randomUUID();
  const userId = req.user!.id;

  const order = await withTransaction(async (client) => {
    // Lock rows in a stable order (sorted by product_id) to avoid deadlocking against a
    // concurrent checkout that touches an overlapping set of products.
    const sortedProductIds = [...cartRows.map((r) => r.product_id)].sort();
    const { rows: locked } = await client.query(
      `SELECT id, stock_quantity FROM products WHERE id = ANY($1::text[]) ORDER BY id FOR UPDATE`,
      [sortedProductIds],
    );
    const stockById = new Map(locked.map((r) => [r.id, r.stock_quantity as number]));

    for (const item of cartRows) {
      const available = stockById.get(item.product_id) ?? 0;
      if (available < item.quantity) {
        throw new HttpError(409, `Not enough stock for "${item.name}" (only ${available} left)`);
      }
    }

    let total = 0;
    await client.query(
      `INSERT INTO orders (id, user_id, status, total, transaction_id, card_brand, card_last4)
       VALUES ($1, $2, 'placed', 0, $3, $4, $5)`,
      [orderId, userId, transactionId, brand, last4],
    );

    for (const item of cartRows) {
      await client.query("UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2", [
        item.quantity,
        item.product_id,
      ]);
      await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity)
         VALUES ($1, $2, $3, $4, $5)`,
        [orderId, item.product_id, item.name, item.price, item.quantity],
      );
      total += item.price * item.quantity;
    }

    total = Math.round(total * 100) / 100;
    await client.query("UPDATE orders SET total = $1 WHERE id = $2", [total, orderId]);
    await client.query("DELETE FROM cart_items WHERE session_id = $1", [req.sessionId]);

    return {
      id: orderId,
      status: "placed",
      total,
      transactionId,
      cardBrand: brand,
      cardLast4: last4,
      createdAt: new Date().toISOString(),
    };
  });

  res.status(201).json(order);
});

ordersRouter.post("/:id/cancel", async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM orders WHERE id = $1", [req.params.id]);
  const order = rows[0];
  if (!order) throw new HttpError(404, "Order not found");
  if (order.user_id !== req.user!.id) throw new HttpError(403, "Not your order");
  if (order.status !== "placed") throw new HttpError(400, "Order is not cancellable");

  await withTransaction(async (client) => {
    const { rows: items } = await client.query("SELECT * FROM order_items WHERE order_id = $1", [order.id]);
    for (const item of items) {
      await client.query("UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2", [
        item.quantity,
        item.product_id,
      ]);
    }
    await client.query("UPDATE orders SET status = 'cancelled' WHERE id = $1", [order.id]);
  });

  res.json({ ok: true });
});
