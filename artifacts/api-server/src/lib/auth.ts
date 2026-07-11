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

    // Gulf residence
    hasGulfResidence: user.hasGulfResidence,
    gulfResidenceCountry: user.gulfResidenceCountry ?? null,
    gulfResidenceNumber: user.gulfResidenceNumber ?? null,
    gulfResidenceExpiry: user.gulfResidenceExpiry ?? null,
    gulfResidenceFrontUrl: user.gulfResidenceFrontUrl ?? null,
    gulfResidenceBackUrl: user.gulfResidenceBackUrl ?? null,

    // Completion
    profileCompletedAt: user.profileCompletedAt ?? null,
  };
}

/**
 * Calculate profile completion percentage for a user.
 * Returns { percentage, isComplete, missingFields }.
 */
export function getProfileCompletion(user: User) {
  const required: Array<[keyof User, string]> = [
    ["firstName",             "الاسم الأول"],
    ["fatherName",            "اسم الأب"],
    ["grandfatherName",       "اسم الجد"],
    ["familyName",            "اسم العائلة"],
    ["englishName",           "الاسم بالإنجليزية"],
    ["gender",                "الجنس"],
    ["dob",                   "تاريخ الميلاد"],
    ["nationality",           "الجنسية"],
    ["placeOfBirth",          "مكان الميلاد"],
    ["maritalStatus",         "الحالة الاجتماعية"],
    ["occupation",            "المهنة"],
    ["email",                 "البريد الإلكتروني"],
    ["whatsapp",              "رقم الواتساب"],
    ["address",               "عنوان السكن"],
    ["passportNumber",        "رقم الجواز"],
    ["passportIssuingCountry","دولة إصدار الجواز"],
    ["passportIssuingPlace",  "مكان إصدار الجواز"],
    ["passportIssueDate",     "تاريخ إصدار الجواز"],
    ["passportExpiry",        "تاريخ انتهاء الجواز"],
    ["passportImageUrl",      "صورة الجواز"],
  ];

  const gulfRequired: Array<[keyof User, string]> = [
    ["gulfResidenceCountry",  "دولة الإقامة الخليجية"],
    ["gulfResidenceNumber",   "رقم الإقامة الخليجية"],
    ["gulfResidenceExpiry",   "تاريخ انتهاء الإقامة الخليجية"],
    ["gulfResidenceFrontUrl", "صورة الإقامة (أمامية)"],
    ["gulfResidenceBackUrl",  "صورة الإقامة (خلفية)"],
  ];

  const allRequired = user.hasGulfResidence
    ? [...required, ...gulfRequired]
    : required;

  const missing = allRequired
    .filter(([key]) => {
      const val = user[key];
      return val === null || val === undefined || val === "";
    })
    .map(([, label]) => label);

  const total = allRequired.length;
  const filled = total - missing.length;
  const percentage = Math.round((filled / total) * 100);
  const isComplete = missing.length === 0;

  return { percentage, isComplete, missingFields: missing };
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
  const user = res.locals.currentUser as User | undefined;
  if (!user || user.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  next();
}
