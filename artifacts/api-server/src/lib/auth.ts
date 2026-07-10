import type { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
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

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  next();
}

export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
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
