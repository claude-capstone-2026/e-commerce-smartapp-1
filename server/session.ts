import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

const COOKIE_NAME = "app_session";

declare global {
  namespace Express {
    interface Request {
      sessionId: string;
    }
  }
}

// Identifies an anonymous cart before sign-in. Deliberately separate from the Better Auth
// session: this cookie names a cart, the auth session names a person, and the two are only
// joined at checkout (see routes/orders.ts) — never merge them into one concept.
export function sessionMiddleware(req: Request, res: Response, next: NextFunction) {
  let sessionId = req.cookies?.[COOKIE_NAME];
  if (!sessionId) {
    sessionId = randomUUID();
    res.cookie(COOKIE_NAME, sessionId, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
  }
  req.sessionId = sessionId;
  next();
}
