import { Router, type IRouter } from "express";
import { asc, eq } from "drizzle-orm";
import { db, bannersTable } from "@workspace/db";
import {
  ListActiveBannersResponse,
  ListAllBannersResponse,
  CreateBannerBody,
  CreateBannerResponse,
  UpdateBannerParams,
  UpdateBannerBody,
  UpdateBannerResponse,
  DeleteBannerParams,
} from "@workspace/api-zod";
import { requireAdmin, requirePermission } from "../lib/auth";

const router: IRouter = Router();

router.get("/banners", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(bannersTable)
    .where(eq(bannersTable.isActive, true))
    .orderBy(asc(bannersTable.sortOrder));

  res.json(ListActiveBannersResponse.parse(rows));
});

router.get("/admin/banners", requireAdmin, requirePermission("banners.view"), async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(bannersTable)
    .orderBy(asc(bannersTable.sortOrder));

  res.json(ListAllBannersResponse.parse(rows));
});

router.post("/admin/banners", requireAdmin, requirePermission("banners.create"), async (req, res): Promise<void> => {
  const parsed = CreateBannerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [banner] = await db.insert(bannersTable).values(parsed.data).returning();

  res.status(201).json(CreateBannerResponse.parse(banner));
});

router.patch(
  "/admin/banners/:id",
  requireAdmin,
  requirePermission("banners.edit"),
  async (req, res): Promise<void> => {
    const params = UpdateBannerParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const parsed = UpdateBannerBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const [banner] = await db
      .update(bannersTable)
      .set(parsed.data)
      .where(eq(bannersTable.id, params.data.id))
      .returning();

    if (!banner) {
      res.status(404).json({ error: "Banner not found" });
      return;
    }

    res.json(UpdateBannerResponse.parse(banner));
  },
);

router.delete(
  "/admin/banners/:id",
  requireAdmin,
  requirePermission("banners.delete"),
  async (req, res): Promise<void> => {
    const params = DeleteBannerParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const [banner] = await db
      .delete(bannersTable)
      .where(eq(bannersTable.id, params.data.id))
      .returning();

    if (!banner) {
      res.status(404).json({ error: "Banner not found" });
      return;
    }

    res.sendStatus(204);
  },
);

export default router;
