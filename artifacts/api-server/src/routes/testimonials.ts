import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, testimonialsTable } from "@workspace/db";
import {
  ListTestimonialsResponse,
  CreateTestimonialBody,
  CreateTestimonialResponse,
  UpdateTestimonialParams,
  UpdateTestimonialBody,
  UpdateTestimonialResponse,
  DeleteTestimonialParams,
} from "@workspace/api-zod";
import { requireAdmin, requirePermission } from "../lib/auth";

const router: IRouter = Router();

router.get("/testimonials", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(testimonialsTable)
    .orderBy(desc(testimonialsTable.createdAt));

  res.json(ListTestimonialsResponse.parse(rows));
});

router.post(
  "/admin/testimonials",
  requireAdmin,
  requirePermission("testimonials.create"),
  async (req, res): Promise<void> => {
    const parsed = CreateTestimonialBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const [testimonial] = await db
      .insert(testimonialsTable)
      .values(parsed.data)
      .returning();

    res.status(201).json(CreateTestimonialResponse.parse(testimonial));
  },
);

router.patch(
  "/admin/testimonials/:id",
  requireAdmin,
  requirePermission("testimonials.edit"),
  async (req, res): Promise<void> => {
    const params = UpdateTestimonialParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const parsed = UpdateTestimonialBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const [testimonial] = await db
      .update(testimonialsTable)
      .set(parsed.data)
      .where(eq(testimonialsTable.id, params.data.id))
      .returning();

    if (!testimonial) {
      res.status(404).json({ error: "Testimonial not found" });
      return;
    }

    res.json(UpdateTestimonialResponse.parse(testimonial));
  },
);

router.delete(
  "/admin/testimonials/:id",
  requireAdmin,
  requirePermission("testimonials.delete"),
  async (req, res): Promise<void> => {
    const params = DeleteTestimonialParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const [testimonial] = await db
      .delete(testimonialsTable)
      .where(eq(testimonialsTable.id, params.data.id))
      .returning();

    if (!testimonial) {
      res.status(404).json({ error: "Testimonial not found" });
      return;
    }

    res.sendStatus(204);
  },
);

export default router;
