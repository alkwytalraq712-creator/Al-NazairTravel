import { Router, type IRouter } from "express";
import { and, eq, gte, lte } from "drizzle-orm";
import { db, packagesTable } from "@workspace/db";
import {
  ListPackagesQueryParams,
  ListPackagesResponse,
  CreatePackageBody,
  CreatePackageResponse,
  GetPackageParams,
  GetPackageResponse,
  UpdatePackageParams,
  UpdatePackageBody,
  UpdatePackageResponse,
  DeletePackageParams,
} from "@workspace/api-zod";
import { requireAdmin } from "../lib/auth";

const router: IRouter = Router();

router.get("/packages", async (req, res): Promise<void> => {
  const query = ListPackagesQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const conditions = [];
  if (query.data.country) {
    conditions.push(eq(packagesTable.country, query.data.country));
  }
  if (query.data.minPrice !== undefined) {
    conditions.push(gte(packagesTable.priceFrom, String(query.data.minPrice)));
  }
  if (query.data.maxPrice !== undefined) {
    conditions.push(lte(packagesTable.priceFrom, String(query.data.maxPrice)));
  }

  const rows = await db
    .select()
    .from(packagesTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(packagesTable.createdAt);

  res.json(ListPackagesResponse.parse(rows));
});

router.post("/packages", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreatePackageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [pkg] = await db
    .insert(packagesTable)
    .values({
      ...parsed.data,
      priceFrom: String(parsed.data.priceFrom),
      rating:
        parsed.data.rating !== undefined ? String(parsed.data.rating) : undefined,
    })
    .returning();

  res.status(201).json(CreatePackageResponse.parse(pkg));
});

router.get("/packages/:id", async (req, res): Promise<void> => {
  const params = GetPackageParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [pkg] = await db
    .select()
    .from(packagesTable)
    .where(eq(packagesTable.id, params.data.id));

  if (!pkg) {
    res.status(404).json({ error: "Package not found" });
    return;
  }

  res.json(GetPackageResponse.parse(pkg));
});

router.patch("/packages/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdatePackageParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdatePackageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [pkg] = await db
    .update(packagesTable)
    .set({
      ...parsed.data,
      priceFrom:
        parsed.data.priceFrom !== undefined
          ? String(parsed.data.priceFrom)
          : undefined,
      rating:
        parsed.data.rating !== undefined ? String(parsed.data.rating) : undefined,
    })
    .where(eq(packagesTable.id, params.data.id))
    .returning();

  if (!pkg) {
    res.status(404).json({ error: "Package not found" });
    return;
  }

  res.json(UpdatePackageResponse.parse(pkg));
});

router.delete(
  "/packages/:id",
  requireAdmin,
  async (req, res): Promise<void> => {
    const params = DeletePackageParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const [pkg] = await db
      .delete(packagesTable)
      .where(eq(packagesTable.id, params.data.id))
      .returning();

    if (!pkg) {
      res.status(404).json({ error: "Package not found" });
      return;
    }

    res.sendStatus(204);
  },
);

export default router;
