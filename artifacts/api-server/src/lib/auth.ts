import type { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import type { User } from "@workspace/db";

const JWT_SECRET = process.env.SESSION_SECRET ?? "changeme";

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
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  next();
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
    // Allow both admin (full access) and staff (permission-restricted, enforced at UI level)
    if (!user || (user.role !== "admin" && user.role !== "staff")) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
}
