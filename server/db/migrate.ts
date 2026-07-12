import "dotenv/config";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { pool } from "./pool.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SEED_PRODUCTS: Array<{
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  stock: number;
}> = [
  { name: "Canvas Tote Bag", description: "Durable everyday tote in natural canvas.", price: 24.0, imageUrl: "https://picsum.photos/seed/tote/400/400", category: "bags", stock: 40 },
  { name: "Ceramic Pour-Over Kettle", description: "1L gooseneck kettle for slow brewing.", price: 58.5, imageUrl: "https://picsum.photos/seed/kettle/400/400", category: "kitchen", stock: 15 },
  { name: "Merino Wool Beanie", description: "Soft, warm, one size fits most.", price: 32.0, imageUrl: "https://picsum.photos/seed/beanie/400/400", category: "apparel", stock: 60 },
  { name: "Walnut Cutting Board", description: "Hand-finished end-grain walnut board.", price: 89.0, imageUrl: "https://picsum.photos/seed/board/400/400", category: "kitchen", stock: 8 },
  { name: "Recycled Notebook Set", description: "Pack of 3 dot-grid notebooks.", price: 18.0, imageUrl: "https://picsum.photos/seed/notebook/400/400", category: "stationery", stock: 100 },
  { name: "Enamel Camp Mug", description: "12oz speckled enamel mug.", price: 14.0, imageUrl: "https://picsum.photos/seed/mug/400/400", category: "kitchen", stock: 75 },
  { name: "Linen Throw Pillow", description: "18x18in cover, natural undyed linen.", price: 36.0, imageUrl: "https://picsum.photos/seed/pillow/400/400", category: "home", stock: 25 },
  { name: "Leather Card Wallet", description: "Slim vegetable-tanned leather wallet.", price: 45.0, imageUrl: "https://picsum.photos/seed/wallet/400/400", category: "accessories", stock: 3 },
];

async function main() {
  const schema = readFileSync(path.join(__dirname, "schema.sql"), "utf-8");
  await pool.query(schema);
  console.log("Schema applied.");

  const { rows } = await pool.query<{ count: string }>("SELECT COUNT(*)::text AS count FROM products");
  if (Number(rows[0]?.count ?? "0") > 0) {
    console.log("Products already seeded, skipping.");
    await pool.end();
    return;
  }

  for (const p of SEED_PRODUCTS) {
    await pool.query(
      `INSERT INTO products (id, name, description, price, image_url, category, stock_quantity)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [randomUUID(), p.name, p.description, p.price, p.imageUrl, p.category, p.stock],
    );
  }
  console.log(`Seeded ${SEED_PRODUCTS.length} products.`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
