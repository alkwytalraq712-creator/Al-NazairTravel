import { Router, type IRouter } from "express";
import { eq, or } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import {
  SignupBody,
  SignupResponse,
  LoginBody,
  LoginResponse,
  GetCurrentUserResponse,
  UpdateProfileBody,
  UpdateProfileResponse,
  RequestPasswordResetBody,
  RequestPasswordResetResponse,
} from "@workspace/api-zod";
import { hashPassword, verifyPassword, serializeUser, generateToken, getProfileCompletion } from "../lib/auth";
import { requireAuth } from "../lib/auth";
import { visaConsentTable } from "@workspace/db";

const router: IRouter = Router();

router.post("/auth/signup", async (req, res): Promise<void> => {
  const parsed = SignupBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.phone, parsed.data.phone));
  if (existing) {
    res.status(400).json({ error: "Phone number already registered" });
    return;
  }

  const passwordHash = await hashPassword(parsed.data.password);
  // nationality is accepted from the request body even if not in the zod schema
  const nationality = typeof req.body?.nationality === 'string' && req.body.nationality.trim()
    ? req.body.nationality.trim()
    : undefined;
  const [user] = await db
    .insert(usersTable)
    .values({
      fullName: parsed.data.fullName,
      phone: parsed.data.phone,
      email: parsed.data.email,
      passwordHash,
      ...(nationality ? { nationality } : {}),
    })
    .returning();

  req.session.userId = user.id;
  const token = generateToken(user.id);
  res.status(201).json({ ...SignupResponse.parse(serializeUser(user)), token });
});

/** Normalize phone to canonical +964XXXXXXXXXX form for flexible matching */
function normalizePhone(raw: string): string[] {
  const digits = raw.replace(/\D/g, "");
  const variants = new Set<string>([raw]);
  if (digits.startsWith("964")) variants.add("+" + digits);
  if (digits.startsWith("0") && digits.length > 1) variants.add("+964" + digits.slice(1));
  if (!raw.startsWith("+")) variants.add("+" + digits);
  if (digits.length === 10 && digits.startsWith("7")) variants.add("+964" + digits);
  return Array.from(variants);
}

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const identifier = parsed.data.identifier;
  const phoneVariants = normalizePhone(identifier);

  const [user] = await db
    .select()
    .from(usersTable)
    .where(
      or(
        ...phoneVariants.map((v) => eq(usersTable.phone, v)),
        eq(usersTable.email, identifier),
      ),
    );

  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  req.session.userId = user.id;
  const token = generateToken(user.id);
  res.json({ ...LoginResponse.parse(serializeUser(user)), token });
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  req.session.destroy(() => {
    res.status(204).send();
  });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  if (!res.locals.currentUser) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  res.json(GetCurrentUserResponse.parse(serializeUser(res.locals.currentUser)));
});

// ── Profile completion ──────────────────────────────────────────────────────

router.get("/auth/profile/completion", requireAuth, async (req, res): Promise<void> => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.session.userId as number));

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.setHeader('Cache-Control', 'no-store');
  res.json(getProfileCompletion(user));
});

// ── Profile update ──────────────────────────────────────────────────────────

router.patch("/auth/profile", async (req, res): Promise<void> => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // After saving, compute profileCompletedAt
  const updateData: Record<string, unknown> = { ...parsed.data };

  // We need to check completion after the potential update — fetch current user first
  const [current] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId));
  if (!current) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  // Merge update into current to compute completion
  const merged = { ...current, ...updateData };
  const { isComplete } = getProfileCompletion(merged as typeof current);

  if (isComplete && !current.profileCompletedAt) {
    updateData.profileCompletedAt = new Date();
  } else if (!isComplete) {
    updateData.profileCompletedAt = null;
  }

  const [user] = await db
    .update(usersTable)
    .set(updateData as Parameters<typeof db.update>[0] extends any ? any : never)
    .where(eq(usersTable.id, req.session.userId))
    .returning();

  res.json(UpdateProfileResponse.parse(serializeUser(user)));
});

router.post("/auth/accept-visa-terms", requireAuth, async (req, res): Promise<void> => {
  const visaId = Number(req.body?.visaId);
  if (!visaId || isNaN(visaId)) {
    res.status(400).json({ error: "visaId required" });
    return;
  }
  const [consent] = await db
    .insert(visaConsentTable)
    .values({ userId: req.session.userId!, visaId })
    .returning();
  res.json({ acceptedAt: consent.acceptedAt.toISOString() });
});

router.post("/auth/change-password", async (req, res): Promise<void> => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const { currentPassword, newPassword } = req.body as {
    currentPassword?: unknown;
    newPassword?: unknown;
  };
  if (!currentPassword || typeof currentPassword !== "string") {
    res.status(400).json({ error: "كلمة المرور الحالية مطلوبة" });
    return;
  }
  if (!newPassword || typeof newPassword !== "string" || newPassword.length < 6) {
    res.status(400).json({ error: "كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const ok = await verifyPassword(currentPassword, user.passwordHash);
  if (!ok) {
    res.status(401).json({ error: "كلمة المرور الحالية غير صحيحة" });
    return;
  }
  const passwordHash = await hashPassword(newPassword);
  await db.update(usersTable).set({ passwordHash }).where(eq(usersTable.id, req.session.userId));
  res.json({ message: "تم تغيير كلمة المرور بنجاح" });
});

router.post("/auth/forgot-password", async (req, res): Promise<void> => {
  const parsed = RequestPasswordResetBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  res.json(RequestPasswordResetResponse.parse({ message: "If an account exists, reset instructions were issued." }));
});

router.post("/auth/reset-password", async (_req, res): Promise<void> => {
  res.status(501).json({ error: "Password reset via identifier is not available. Please contact support." });
});

export default router;
