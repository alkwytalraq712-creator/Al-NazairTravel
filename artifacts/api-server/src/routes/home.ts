import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, visasTable, packagesTable, bannersTable, testimonialsTable } from "@workspace/db";
import { GetHomeSummaryResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/home", async (_req, res): Promise<void> => {
  const featuredVisas = await db
    .select()
    .from(visasTable)
    .where(eq(visasTable.isFeatured, true))
    .orderBy(desc(visasTable.createdAt))
    .limit(6);

  const popularPackages = await db
    .select()
    .from(packagesTable)
    .where(eq(packagesTable.isFeatured, true))
    .orderBy(desc(packagesTable.createdAt))
    .limit(6);

  const banners = await db
    .select()
    .from(bannersTable)
    .where(eq(bannersTable.isActive, true))
    .orderBy(bannersTable.sortOrder);

  const testimonials = await db
    .select()
    .from(testimonialsTable)
    .orderBy(desc(testimonialsTable.createdAt))
    .limit(6);

  const offers = await db
    .select()
    .from(packagesTable)
    .orderBy(desc(packagesTable.createdAt))
    .limit(6);

  res.json(
    GetHomeSummaryResponse.parse({
      featuredVisas,
      popularPackages,
      banners,
      testimonials,
      offers,
    }),
  );
});

export default router;
