import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import { db, visaApplicationsTable, visasTable } from "@workspace/db";
import {
  ListMyVisaApplicationsResponse,
  CreateVisaApplicationBody,
  CreateVisaApplicationResponse,
  GetVisaApplicationParams,
  GetVisaApplicationResponse,
  ListAllVisaApplicationsQueryParams,
  ListAllVisaApplicationsResponse,
  UpdateVisaApplicationStatusParams,
  UpdateVisaApplicationStatusBody,
  UpdateVisaApplicationStatusResponse,
} from "@workspace/api-zod";
import { requireAdmin, requireAuth } from "../lib/auth";
import { generateReferenceNumber } from "../lib/reference";

const router: IRouter = Router();

function withVisa<T extends { visaId: number }>(row: T, visa: unknown) {
  return { ...row, visa: visa ?? null };
}

router.get(
  "/visa-applications",
  requireAuth,
  async (req, res): Promise<void> => {
    const rows = await db
      .select({ application: visaApplicationsTable, visa: visasTable })
      .from(visaApplicationsTable)
      .leftJoin(visasTable, eq(visaApplicationsTable.visaId, visasTable.id))
      .where(eq(visaApplicationsTable.userId, req.session.userId as number))
      .orderBy(desc(visaApplicationsTable.createdAt));

    res.json(
      ListMyVisaApplicationsResponse.parse(
        rows.map((r) => withVisa(r.application, r.visa)),
      ),
    );
  },
);

router.post(
  "/visa-applications",
  requireAuth,
  async (req, res): Promise<void> => {
    const parsed = CreateVisaApplicationBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const [application] = await db
      .insert(visaApplicationsTable)
      .values({
        ...parsed.data,
        passportExpiry: parsed.data.passportExpiry.toISOString().slice(0, 10),
        dob: parsed.data.dob.toISOString().slice(0, 10),
        userId: req.session.userId as number,
        referenceNumber: generateReferenceNumber("VISA"),
      })
      .returning();

    const [visa] = await db
      .select()
      .from(visasTable)
      .where(eq(visasTable.id, application.visaId));

    res
      .status(201)
      .json(CreateVisaApplicationResponse.parse(withVisa(application, visa)));
  },
);

router.get(
  "/visa-applications/:id",
  requireAuth,
  async (req, res): Promise<void> => {
    const params = GetVisaApplicationParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const [row] = await db
      .select({ application: visaApplicationsTable, visa: visasTable })
      .from(visaApplicationsTable)
      .leftJoin(visasTable, eq(visaApplicationsTable.visaId, visasTable.id))
      .where(eq(visaApplicationsTable.id, params.data.id));

    if (!row) {
      res.status(404).json({ error: "Visa application not found" });
      return;
    }

    res.json(
      GetVisaApplicationResponse.parse(withVisa(row.application, row.visa)),
    );
  },
);

router.get(
  "/admin/visa-applications",
  requireAdmin,
  async (req, res): Promise<void> => {
    const query = ListAllVisaApplicationsQueryParams.safeParse(req.query);
    if (!query.success) {
      res.status(400).json({ error: query.error.message });
      return;
    }

    const rows = await db
      .select({ application: visaApplicationsTable, visa: visasTable })
      .from(visaApplicationsTable)
      .leftJoin(visasTable, eq(visaApplicationsTable.visaId, visasTable.id))
      .where(
        query.data.status
          ? eq(visaApplicationsTable.status, query.data.status)
          : undefined,
      )
      .orderBy(desc(visaApplicationsTable.createdAt));

    res.json(
      ListAllVisaApplicationsResponse.parse(
        rows.map((r) => withVisa(r.application, r.visa)),
      ),
    );
  },
);

router.patch(
  "/admin/visa-applications/:id/status",
  requireAdmin,
  async (req, res): Promise<void> => {
    const params = UpdateVisaApplicationStatusParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const parsed = UpdateVisaApplicationStatusBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const [application] = await db
      .update(visaApplicationsTable)
      .set({ status: parsed.data.status })
      .where(eq(visaApplicationsTable.id, params.data.id))
      .returning();

    if (!application) {
      res.status(404).json({ error: "Visa application not found" });
      return;
    }

    const [visa] = await db
      .select()
      .from(visasTable)
      .where(eq(visasTable.id, application.visaId));

    res.json(
      UpdateVisaApplicationStatusResponse.parse(
        withVisa(application, visa),
      ),
    );
  },
);

export default router;
