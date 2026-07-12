import { Router } from "express";
import { pool, withTransaction, HttpError } from "../db/pool.js";
import { requireAuth, requireAdmin } from "../auth.js";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireAdmin);

function toProduct(row: any) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: row.price,
    imageUrl: row.image_url,
    category: row.category,
    stockQuantity: row.stock_quantity,
  };
}

function toAdjustment(row: any) {
  return {
    id: row.id,
    productId: row.product_id,
    delta: row.delta,
    resultingQuantity: row.resulting_quantity,
    reason: row.reason,
    adminName: row.admin_name,
    createdAt: row.created_at,
  };
}

adminRouter.get("/products", async (_req, res) => {
  const { rows } = await pool.query("SELECT * FROM products ORDER BY name ASC");
  res.json(rows.map(toProduct));
});

adminRouter.get("/stock-adjustments", async (_req, res) => {
  const { rows } = await pool.query(
    "SELECT * FROM stock_adjustments ORDER BY created_at DESC LIMIT 100",
  );
  res.json(rows.map(toAdjustment));
});

// Adjust stock by a signed delta (restock: positive, correction/damage: negative), logged to
// stock_adjustments for an audit trail. Same row-lock pattern as checkout/cancel so a stock
// adjustment can never race a concurrent checkout into a negative or inconsistent count.
adminRouter.post("/products/:id/stock-adjustments", async (req, res) => {
  const { delta, reason } = req.body ?? {};
  if (!Number.isInteger(delta) || delta === 0) {
    throw new HttpError(400, "delta must be a non-zero integer");
  }
  if (reason !== undefined && typeof reason !== "string") {
    throw new HttpError(400, "reason must be a string");
  }

  const result = await withTransaction(async (client) => {
    const { rows } = await client.query(
      "SELECT id, stock_quantity FROM products WHERE id = $1 FOR UPDATE",
      [req.params.id],
    );
    const product = rows[0];
    if (!product) throw new HttpError(404, "Product not found");

    const newQuantity = product.stock_quantity + delta;
    if (newQuantity < 0) {
      throw new HttpError(400, `Adjustment would result in negative stock (currently ${product.stock_quantity})`);
    }

    await client.query("UPDATE products SET stock_quantity = $1 WHERE id = $2", [newQuantity, req.params.id]);

    const { rows: adjRows } = await client.query(
      `INSERT INTO stock_adjustments (product_id, delta, resulting_quantity, reason, admin_user_id, admin_name)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.params.id, delta, newQuantity, reason ?? "", req.user!.id, req.user!.name],
    );

    const { rows: updatedProduct } = await client.query("SELECT * FROM products WHERE id = $1", [req.params.id]);
    return { product: toProduct(updatedProduct[0]), adjustment: toAdjustment(adjRows[0]) };
  });

  res.status(201).json(result);
});
