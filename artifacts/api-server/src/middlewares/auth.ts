import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Fail fast at startup if SESSION_SECRET is not set — never use a known fallback
const _rawSecret = process.env.SESSION_SECRET;
if (!_rawSecret) {
  throw new Error(
    "SESSION_SECRET environment variable is required but was not set. " +
      "Generate a strong random secret and set it in your environment.",
  );
}
// Narrowed to string after the throw guard above
const JWT_SECRET: string = _rawSecret;

export interface JwtPayload {
  userId: number;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  if (req.user.role !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  next();
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}
