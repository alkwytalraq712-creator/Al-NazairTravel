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
  ResetPasswordBody,
  ResetPasswordResponse,
} from "@workspace/api-zod";
import { hashPassword, verifyPassword, serializeUser } from "../lib/auth";

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
  const [user] = await db
    .insert(usersTable)
    .values({
      fullName: parsed.data.fullName,
      phone: parsed.data.phone,
      email: parsed.data.email,
      passwordHash,
    })
    .returning();

  req.session.userId = user.id;
  res.status(201).json(SignupResponse.parse(serializeUser(user)));
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(
      or(
        eq(usersTable.phone, parsed.data.identifier),
        eq(usersTable.email, parsed.data.identifier),
      ),
    );

  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  req.session.userId = user.id;
  res.json(LoginResponse.parse(serializeUser(user)));
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

  const [user] = await db
    .update(usersTable)
    .set(parsed.data)
    .where(eq(usersTable.id, req.session.userId))
    .returning();

  res.json(UpdateProfileResponse.parse(serializeUser(user)));
});

router.post("/auth/forgot-password", async (req, res): Promise<void> => {
  const parsed = RequestPasswordResetBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  // v1: no real OTP/email delivery -- caller proceeds directly to reset-password.
  res.json(
    RequestPasswordResetResponse.parse({
      message: "If an account exists, reset instructions were issued.",
    }),
  );
});

router.post("/auth/reset-password", async (req, res): Promise<void> => {
  const parsed = ResetPasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(
      or(
        eq(usersTable.phone, parsed.data.identifier),
        eq(usersTable.email, parsed.data.identifier),
      ),
    );

  if (!user) {
    res.status(400).json({ error: "No account found" });
    return;
  }

  const passwordHash = await hashPassword(parsed.data.newPassword);
  await db
    .update(usersTable)
    .set({ passwordHash })
    .where(eq(usersTable.id, user.id));

  res.json(ResetPasswordResponse.parse({ message: "Password reset" }));
});

export default router;
