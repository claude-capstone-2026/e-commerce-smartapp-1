import { Router } from "express";
import { pool, HttpError } from "../db/pool.js";

export const productsRouter = Router();

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

productsRouter.get("/", async (_req, res) => {
  const { rows } = await pool.query("SELECT * FROM products ORDER BY created_at ASC");
  res.json(rows.map(toProduct));
});

productsRouter.get("/:id", async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM products WHERE id = $1", [req.params.id]);
  if (!rows[0]) throw new HttpError(404, "Product not found");
  res.json(toProduct(rows[0]));
});
