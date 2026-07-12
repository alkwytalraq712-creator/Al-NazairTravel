import { Router, type IRouter } from "express";
import { asc, eq } from "drizzle-orm";
import { db, companySettingsTable, branchTable, holdSettingsTable, serviceSettingsTable } from "@workspace/db";
import { requireAdmin, requirePermission } from "../lib/auth";

const router: IRouter = Router();

// ─── Company Settings ─────────────────────────────────────────────────────────

router.get("/settings/company", async (_req, res): Promise<void> => {
  const [settings] = await db.select().from(companySettingsTable).where(eq(companySettingsTable.id, 1));
  if (!settings) {
    // Auto-create the singleton row if missing
    const [created] = await db.insert(companySettingsTable).values({ id: 1 }).returning();
    res.json(created);
    return;
  }
  res.json(settings);
});

router.patch("/settings/company", requireAdmin, requirePermission("settings.company"), async (req, res): Promise<void> => {
  const [updated] = await db
    .update(companySettingsTable)
    .set({ ...req.body, updatedAt: new Date() })
    .where(eq(companySettingsTable.id, 1))
    .returning();
  if (!updated) {
    const [created] = await db
      .insert(companySettingsTable)
      .values({ id: 1, ...req.body, updatedAt: new Date() })
      .returning();
    res.json(created);
    return;
  }
  res.json(updated);
});

// ─── Hold Booking Settings ────────────────────────────────────────────────────

router.get("/settings/hold", async (_req, res): Promise<void> => {
  const [settings] = await db.select().from(holdSettingsTable).where(eq(holdSettingsTable.id, 1));
  if (!settings) {
    const [created] = await db.insert(holdSettingsTable).values({ id: 1 }).returning();
    res.json(created);
    return;
  }
  res.json(settings);
});

router.patch("/admin/settings/hold", requireAdmin, requirePermission("settings.company"), async (req, res): Promise<void> => {
  const allowedKeys = ["holdEnabled", "holdFeeAmount", "holdDurationHours"] as const;
  const update: Record<string, unknown> = {};
  for (const key of allowedKeys) {
    if (key in req.body) update[key] = req.body[key];
  }
  const [existing] = await db.select().from(holdSettingsTable).where(eq(holdSettingsTable.id, 1));
  if (existing) {
    const [updated] = await db
      .update(holdSettingsTable)
      .set({ ...update, updatedAt: new Date() })
      .where(eq(holdSettingsTable.id, 1))
      .returning();
    res.json(updated);
  } else {
    const [created] = await db
      .insert(holdSettingsTable)
      .values({ id: 1, ...update, updatedAt: new Date() } as any)
      .returning();
    res.json(created);
  }
});

// ─── Service Settings (flights / packages / visas toggle) ─────────────────────

router.get("/settings/services", async (_req, res): Promise<void> => {
  const [row] = await db.select().from(serviceSettingsTable).where(eq(serviceSettingsTable.id, 1));
  if (!row) {
    const [created] = await db.insert(serviceSettingsTable).values({ id: 1 }).returning();
    res.json(created);
    return;
  }
  res.json(row);
});

router.patch("/admin/settings/services", requireAdmin, requirePermission("settings.company"), async (req, res): Promise<void> => {
  const allowed = ["flightsEnabled", "packagesEnabled", "visasEnabled"] as const;
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in req.body) update[key] = Boolean(req.body[key]);
  }
  const [existing] = await db.select().from(serviceSettingsTable).where(eq(serviceSettingsTable.id, 1));
  if (existing) {
    const [updated] = await db
      .update(serviceSettingsTable)
      .set({ ...update, updatedAt: new Date() })
      .where(eq(serviceSettingsTable.id, 1))
      .returning();
    res.json(updated);
  } else {
    const [created] = await db
      .insert(serviceSettingsTable)
      .values({ id: 1, ...update, updatedAt: new Date() } as any)
      .returning();
    res.json(created);
  }
});

// ─── Branches ─────────────────────────────────────────────────────────────────

router.get("/settings/branches", async (_req, res): Promise<void> => {
  const branches = await db
    .select()
    .from(branchTable)
    .orderBy(asc(branchTable.sortOrder), asc(branchTable.id));
  res.json(branches);
});

router.post("/settings/branches", requireAdmin, requirePermission("settings.company"), async (req, res): Promise<void> => {
  const [branch] = await db.insert(branchTable).values(req.body).returning();
  res.status(201).json(branch);
});

router.put("/settings/branches/:id", requireAdmin, requirePermission("settings.company"), async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  // If setting isMain = true, clear isMain on all others first
  if (req.body.isMain) {
    await db.update(branchTable).set({ isMain: false });
  }

  const [branch] = await db
    .update(branchTable)
    .set(req.body)
    .where(eq(branchTable.id, id))
    .returning();
  if (!branch) { res.status(404).json({ error: "Branch not found" }); return; }
  res.json(branch);
});

router.delete("/settings/branches/:id", requireAdmin, requirePermission("settings.company"), async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(branchTable).where(eq(branchTable.id, id));
  res.status(204).send();
});

export default router;
