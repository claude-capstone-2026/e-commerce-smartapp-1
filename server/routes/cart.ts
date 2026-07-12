import { Router } from "express";
import { pool, HttpError } from "../db/pool.js";

export const cartRouter = Router();

async function getCart(sessionId: string) {
  const { rows } = await pool.query(
    `SELECT ci.product_id, ci.quantity, p.name, p.price, p.image_url, p.stock_quantity
     FROM cart_items ci
     JOIN products p ON p.id = ci.product_id
     WHERE ci.session_id = $1
     ORDER BY ci.created_at ASC`,
    [sessionId],
  );
  const items = rows.map((r) => ({
    productId: r.product_id,
    name: r.name,
    price: r.price,
    imageUrl: r.image_url,
    quantity: r.quantity,
    stockQuantity: r.stock_quantity,
    lineTotal: Math.round(r.price * r.quantity * 100) / 100,
  }));
  const total = Math.round(items.reduce((sum, i) => sum + i.lineTotal, 0) * 100) / 100;
  return { items, total };
}

cartRouter.get("/", async (req, res) => {
  res.json(await getCart(req.sessionId));
});

cartRouter.post("/", async (req, res) => {
  const { productId, quantity } = req.body ?? {};
  if (typeof productId !== "string" || !productId) {
    throw new HttpError(400, "productId is required");
  }
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new HttpError(400, "quantity must be a positive integer");
  }

  const { rows: productRows } = await pool.query("SELECT id FROM products WHERE id = $1", [productId]);
  if (!productRows[0]) throw new HttpError(404, "Product not found");

  await pool.query(
    `INSERT INTO cart_items (session_id, product_id, quantity)
     VALUES ($1, $2, $3)
     ON CONFLICT (session_id, product_id)
     DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity`,
    [req.sessionId, productId, quantity],
  );

  res.status(201).json(await getCart(req.sessionId));
});

cartRouter.patch("/:productId", async (req, res) => {
  const { quantity } = req.body ?? {};
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new HttpError(400, "quantity must be a positive integer");
  }
  const { rowCount } = await pool.query(
    "UPDATE cart_items SET quantity = $1 WHERE session_id = $2 AND product_id = $3",
    [quantity, req.sessionId, req.params.productId],
  );
  if (!rowCount) throw new HttpError(404, "Item not in cart");
  res.json(await getCart(req.sessionId));
});

cartRouter.delete("/:productId", async (req, res) => {
  await pool.query("DELETE FROM cart_items WHERE session_id = $1 AND product_id = $2", [
    req.sessionId,
    req.params.productId,
  ]);
  res.json(await getCart(req.sessionId));
});
