import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth.js";
import { HttpError } from "./db/pool.js";
import { sessionMiddleware } from "./session.js";
import { productsRouter } from "./routes/products.js";
import { cartRouter } from "./routes/cart.js";
import { ordersRouter } from "./routes/orders.js";
import { adminRouter } from "./routes/admin.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Better Auth needs the RAW request body — must be mounted before express.json().
app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());
app.use(cookieParser());
app.use(sessionMiddleware);

// No DB dependency — a transient Neon blip must not fail Render's health check.
app.get("/healthz", (_req, res) => res.status(200).send("ok"));

app.use("/api/products", productsRouter);
app.use("/api/cart", cartRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/admin", adminRouter);

// Serve the built frontend; SPA fallback so client-side routes survive a hard refresh.
// __dirname is dist/server at runtime (this file is compiled there); dist/client is its sibling.
const clientDist = path.join(__dirname, "..", "client");
if (existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(clientDist, "index.html")));
}

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(Number(process.env.PORT ?? 3001), () => {
  console.log(`Server listening on port ${process.env.PORT ?? 3001}`);
});
