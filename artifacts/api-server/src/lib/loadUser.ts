import type { Request, Response, NextFunction } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { extractBearerToken, verifyToken } from "./auth";

export async function loadCurrentUser(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  // Resolve userId from session cookie OR JWT Bearer token
  let userId = req.session.userId;

  if (!userId) {
    const token = extractBearerToken(req);
    if (token) {
      const payload = verifyToken(token);
      if (payload) {
        userId = payload.userId;
        // Populate session so requireAuth and other middleware work seamlessly
        req.session.userId = userId;
      }
    }
  }

  if (!userId) {
    next();
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId));

  if (user) {
    res.locals.currentUser = user;
  }
  next();
}
