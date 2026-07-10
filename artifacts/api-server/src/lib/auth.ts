import type { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { User } from "@workspace/db";

declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function serializeUser(user: User) {
  return {
    id: user.id,
    fullName: user.fullName,
    phone: user.phone,
    email: user.email ?? null,
    avatarUrl: user.avatarUrl ?? null,
    role: user.role,
    language: user.language,
    currency: user.currency,
    createdAt: user.createdAt,
  };
}

function getJwtSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET not set");
  return secret;
}

export function generateToken(userId: number): string {
  return jwt.sign({ userId }, getJwtSecret(), { expiresIn: "30d" });
}

export function verifyToken(token: string): { userId: number } | null {
  try {
    const payload = jwt.verify(token, getJwtSecret()) as { userId: number };
    return payload;
  } catch {
    return null;
  }
}

/** Extract Bearer token from Authorization header */
export function extractBearerToken(req: Request): string | null {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith("Bearer ")) {
    return auth.slice(7);
  }
  return null;
}

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  // Accept JWT Bearer token (mobile) OR session cookie (web)
  const token = extractBearerToken(req);
  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      req.session.userId = payload.userId; // populate for downstream middleware
      next();
      return;
    }
  }
  if (req.session.userId) {
    next();
    return;
  }
  res.status(401).json({ error: "Not authenticated" });
}

export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const token = extractBearerToken(req);
  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      req.session.userId = payload.userId;
    }
  }
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const currentUser = res.locals.currentUser as User | undefined;
  if (!currentUser || currentUser.role !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  next();
}
