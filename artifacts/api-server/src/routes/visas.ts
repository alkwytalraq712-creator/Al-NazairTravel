import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, visasTable } from "@workspace/db";
import {
  ListVisasQueryParams,
  ListVisasResponse,
  CreateVisaBody,
  CreateVisaResponse,
  GetVisaParams,
  GetVisaResponse,
  UpdateVisaParams,
  UpdateVisaBody,
  UpdateVisaResponse,
  DeleteVisaParams,
} from "@workspace/api-zod";
import { requireAdmin } from "../lib/auth";
import { coerceVisa } from "../lib/coerce";

const router: IRouter = Router();

router.get("/visas", async (req, res): Promise<void> => {
  const query = ListVisasQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const conditions = [];
  if (query.data.visaType) {
    conditions.push(eq(visasTable.visaType, query.data.visaType));
  }
  if (query.data.country) {
    conditions.push(eq(visasTable.countryName, query.data.country));
  }

  const rows = await db
    .select()
    .from(visasTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(visasTable.createdAt);

  res.json(ListVisasResponse.parse(rows.map(coerceVisa)));
});

router.post("/visas", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateVisaBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [visa] = await db
    .insert(visasTable)
    .values({ ...parsed.data, price: String(parsed.data.price) })
    .returning();

  res.status(201).json(CreateVisaResponse.parse(coerceVisa(visa)));
});

router.get("/visas/:id", async (req, res): Promise<void> => {
  const params = GetVisaParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [visa] = await db
    .select()
    .from(visasTable)
    .where(eq(visasTable.id, params.data.id));

  if (!visa) {
    res.status(404).json({ error: "Visa not found" });
    return;
  }

  res.json(GetVisaResponse.parse(coerceVisa(visa)));
});

router.patch("/visas/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateVisaParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateVisaBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [visa] = await db
    .update(visasTable)
    .set({
      ...parsed.data,
      price:
        parsed.data.price !== undefined ? String(parsed.data.price) : undefined,
    })
    .where(eq(visasTable.id, params.data.id))
    .returning();

  if (!visa) {
    res.status(404).json({ error: "Visa not found" });
    return;
  }

  res.json(UpdateVisaResponse.parse(coerceVisa(visa)));
});

router.delete("/visas/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteVisaParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [visa] = await db
    .delete(visasTable)
    .where(eq(visasTable.id, params.data.id))
    .returning();

  if (!visa) {
    res.status(404).json({ error: "Visa not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
