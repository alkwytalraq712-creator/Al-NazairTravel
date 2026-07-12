import type { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import type { User } from "@workspace/db";

// Fail loudly at module load time if the secret is absent — a silent fallback
// to a known string like "changeme" would let anyone forge valid JWT tokens.
if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET environment variable is required for JWT signing.");
}
const JWT_SECRET: string = process.env.SESSION_SECRET;

export function generateToken(userId: number): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "30d" });
}

export function verifyToken(token: string): { userId: number } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: number };
  } catch {
    return null;
  }
}

export function extractBearerToken(req: Request): string | null {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) return null;
  return auth.slice(7);
}

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
    permissions: (user as any).permissions ?? null,

    // Profile fields
    firstName: user.firstName ?? null,
    fatherName: user.fatherName ?? null,
    grandfatherName: user.grandfatherName ?? null,
    familyName: user.familyName ?? null,
    englishName: user.englishName ?? null,
    gender: user.gender ?? null,
    dob: user.dob ?? null,
    nationality: user.nationality ?? null,
    placeOfBirth: user.placeOfBirth ?? null,
    maritalStatus: user.maritalStatus ?? null,
    occupation: user.occupation ?? null,
    whatsapp: user.whatsapp ?? null,
    address: user.address ?? null,

    // Passport
    passportNumber: user.passportNumber ?? null,
    passportIssuingCountry: user.passportIssuingCountry ?? null,
    passportIssuingPlace: user.passportIssuingPlace ?? null,
    passportIssueDate: user.passportIssueDate ?? null,
    passportExpiry: user.passportExpiry ?? null,
    passportImageUrl: user.passportImageUrl ?? null,

    // Gulf residence (legacy kept for compat) + new residence type
    hasGulfResidence: user.hasGulfResidence,
    gulfResidenceCountry: user.gulfResidenceCountry ?? null,
    gulfResidenceNumber: user.gulfResidenceNumber ?? null,
    gulfResidenceExpiry: user.gulfResidenceExpiry ?? null,
    gulfResidenceFrontUrl: user.gulfResidenceFrontUrl ?? null,
    gulfResidenceBackUrl: user.gulfResidenceBackUrl ?? null,
    residenceType: (user as any).residenceType ?? 'none',

    // Active foreign visas & travel history
    hasActiveForeignVisa: user.hasActiveForeignVisa,
    activeVisas: user.activeVisas ?? [],
    hasTravelHistory: user.hasTravelHistory,
    travelHistory: user.travelHistory ?? [],

    // Completion
    profileCompletedAt: user.profileCompletedAt ?? null,
  };
}

/**
 * Calculate profile completion percentage.
 * Uses simplified required fields matching the new 3-step profile form.
 */
export function getProfileCompletion(user: User) {
  const required: Array<[string, string]> = [
    ["avatarUrl",         "الصورة الشخصية"],
    ["fullName",          "الاسم الكامل"],
    ["nationality",       "الجنسية"],
    ["dob",               "تاريخ الميلاد"],
    ["passportNumber",    "رقم جواز السفر"],
    ["passportIssueDate", "تاريخ إصدار الجواز"],
    ["passportExpiry",    "تاريخ انتهاء صلاحية الجواز"],
    ["passportImageUrl",  "صورة جواز السفر"],
  ];

  const residenceType = (user as any).residenceType ?? 'none';
  const residenceRequired: Array<[string, string]> = residenceType !== 'none' ? [
    ["gulfResidenceFrontUrl", "صورة الإقامة/التأشيرة (الوجه الأمامي)"],
    ["gulfResidenceBackUrl",  "صورة الإقامة/التأشيرة (الوجه الخلفي)"],
  ] : [];

  const allRequired = [...required, ...residenceRequired];

  const missing = allRequired
    .filter(([key]) => {
      const val = (user as any)[key];
      return val === null || val === undefined || val === '';
    })
    .map(([, label]) => label);

  const total = allRequired.length;
  const filled = total - missing.length;
  const percentage = total === 0 ? 100 : Math.round((filled / total) * 100);
  const isComplete = missing.length === 0;

  return { percentage, isComplete, missingFields: missing };
}

// ── Middleware ─────────────────────────────────────────────────────────────────

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  // Primary: session already populated (web cookie OR loadCurrentUser already ran)
  if (req.session.userId) {
    return next();
  }
  // Secondary: mobile app sends Bearer token — check it directly as a safety net
  // in case loadCurrentUser had a timing or async issue
  const token = extractBearerToken(req);
  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      req.session.userId = payload.userId;
      return next();
    }
  }
  res.status(401).json({ error: "Not authenticated" });
}

export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  try {
    const [user] = await db
      .select({ role: usersTable.role })
      .from(usersTable)
      .where(eq(usersTable.id, req.session.userId));
    // Allow both admin (full access) and staff (permission-restricted, enforced server-side via requirePermission)
    if (!user || (user.role !== "admin" && user.role !== "staff")) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Middleware factory — enforces a specific granular permission key.
 * Admin (role = 'admin', permissions = null) always passes.
 * Staff must have the exact key, a sub-key, OR the legacy module root key.
 *
 * Usage: router.delete('/...', requireAdmin, requirePermission('visa_applications.delete'), handler)
 */
export function requirePermission(permKey: string) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    if (!req.session.userId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    try {
      const [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, req.session.userId));

      if (!user) {
        res.status(401).json({ error: "User not found" });
        return;
      }

      // Admin = full access
      if (user.role === "admin") {
        next();
        return;
      }

      // Staff — check granular permissions
      const perms = (user as any).permissions as string[] | null;
      if (!perms) {
        res.status(403).json({ error: `ليس لديك صلاحية للقيام بهذا الإجراء` });
        return;
      }

      // Exact match
      if (perms.includes(permKey)) { next(); return; }

      // Legacy: module root key grants all actions in that module
      const root = permKey.includes(".") ? permKey.split(".")[0] : permKey;
      if (perms.includes(root)) { next(); return; }

      res.status(403).json({
        error: `ليس لديك صلاحية للقيام بهذا الإجراء (${permKey})`,
      });
    } catch {
      res.status(500).json({ error: "Internal server error" });
    }
  };
}
