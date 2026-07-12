import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import { db, visaApplicationsTable, visasTable, usersTable } from "@workspace/db";
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
import { requireAdmin, requireAuth, requirePermission, getProfileCompletion } from "../lib/auth";
import { generateReferenceNumber } from "../lib/reference";
import { coerceVisa } from "../lib/coerce";

const router: IRouter = Router();

function withVisa<T extends { visaId: number }>(row: T, visa: unknown) {
  const coerced = visa != null ? coerceVisa(visa as { price: unknown; rating?: unknown }) : null;
  return { ...row, visa: coerced };
}

// GET /visa-applications/my-latest — must be declared BEFORE /:id to avoid route conflicts
router.get(
  "/visa-applications/my-latest",
  requireAuth,
  async (req, res): Promise<void> => {
    const [row] = await db
      .select({ application: visaApplicationsTable, visa: visasTable })
      .from(visaApplicationsTable)
      .leftJoin(visasTable, eq(visaApplicationsTable.visaId, visasTable.id))
      .where(eq(visaApplicationsTable.userId, req.session.userId as number))
      .orderBy(desc(visaApplicationsTable.createdAt))
      .limit(1);

    if (!row) {
      res.status(404).json({ error: "لا توجد طلبات تأشيرة" });
      return;
    }

    res.json(GetVisaApplicationResponse.parse(withVisa(row.application, row.visa)));
  },
);

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

    res.json(ListMyVisaApplicationsResponse.parse(rows.map((r) => withVisa(r.application, r.visa))));
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

    const userId = req.session.userId as number;

    // Load user profile to auto-fill application data
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    // Gate: profile must be 100% complete
    const { isComplete, missingFields } = getProfileCompletion(user);
    if (!isComplete) {
      res.status(422).json({
        error: "يجب إكمال الملف الشخصي أولاً قبل تقديم أي طلب تأشيرة.",
        code: "PROFILE_INCOMPLETE",
        missingFields,
      });
      return;
    }

    // Load visa to check requirements
    const [visa] = await db.select().from(visasTable).where(eq(visasTable.id, parsed.data.visaId));
    if (!visa) {
      res.status(404).json({ error: "Visa not found" });
      return;
    }

    // Gulf residence gate
    if (visa.requiresGulfResidence && !user.hasGulfResidence) {
      res.status(422).json({
        error: "عذراً، لا يمكن التقديم على هذه التأشيرة لأن هذه الدولة تشترط وجود إقامة سارية بإحدى دول مجلس التعاون الخليجي.",
        code: "GULF_RESIDENCE_REQUIRED",
      });
      return;
    }

    // Auto-fill all fields from user profile
    const now = new Date().toISOString();
    const [application] = await db
      .insert(visaApplicationsTable)
      .values({
        visaId: parsed.data.visaId,
        userId,
        referenceNumber: generateReferenceNumber("VISA"),
        // Personal data from profile
        fullName: user.englishName || user.fullName,
        phone: user.phone,
        email: user.email || "",
        nationality: user.nationality || "",
        gender: user.gender || "",
        dob: user.dob || "",
        occupation: user.occupation || "",
        city: user.address || "",
        // Passport & photos from profile
        passportNumber: user.passportNumber || "",
        passportExpiry: user.passportExpiry || "",
        passportImageUrl: user.passportImageUrl,
        personalPhotoUrl: user.avatarUrl,
        // OCR-enriched fields from profile
        passportType: null,
        issuingCountry: user.passportIssuingCountry,
        passportIssueDate: user.passportIssueDate,
        placeOfBirth: user.placeOfBirth,
        // Initial status history
        statusHistory: [{ status: "received", timestamp: now }],
      })
      .returning();

    res.status(201).json(CreateVisaApplicationResponse.parse(withVisa(application, visa)));
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

    if (row.application.userId !== req.session.userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    res.json(GetVisaApplicationResponse.parse(withVisa(row.application, row.visa)));
  },
);

router.get(
  "/admin/visa-applications",
  requireAdmin,
  requirePermission("visa_applications.view"),
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
      .where(query.data.status ? eq(visaApplicationsTable.status, query.data.status) : undefined)
      .orderBy(desc(visaApplicationsTable.createdAt));

    res.json(ListAllVisaApplicationsResponse.parse(rows.map((r) => withVisa(r.application, r.visa))));
  },
);

router.patch(
  "/admin/visa-applications/:id/status",
  requireAdmin,
  requirePermission("visa_applications.update_status"),
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

    // Load existing application to append to history
    const [existing] = await db
      .select()
      .from(visaApplicationsTable)
      .where(eq(visaApplicationsTable.id, params.data.id));

    if (!existing) {
      res.status(404).json({ error: "Visa application not found" });
      return;
    }

    const updatedHistory = [
      ...(existing.statusHistory ?? []),
      { status: parsed.data.status, timestamp: new Date().toISOString() },
    ];

    // requestedDocuments is an extension beyond the zod schema — extract directly
    const incomingDocs = req.body?.requestedDocuments;
    const requestedDocuments: Array<{ name: string }> | undefined =
      parsed.data.status === 'awaiting_documents' &&
      Array.isArray(incomingDocs) &&
      incomingDocs.length > 0
        ? incomingDocs
        : undefined;

    const [application] = await db
      .update(visaApplicationsTable)
      .set({
        status: parsed.data.status,
        statusHistory: updatedHistory,
        ...(requestedDocuments ? { requestedDocuments } : {}),
      })
      .where(eq(visaApplicationsTable.id, params.data.id))
      .returning();

    if (!application) {
      res.status(404).json({ error: "Visa application not found" });
      return;
    }

    const [visa] = await db.select().from(visasTable).where(eq(visasTable.id, application.visaId));
    res.json(UpdateVisaApplicationStatusResponse.parse(withVisa(application, visa)));
  },
);

// PATCH /visa-applications/:id/additional-documents
// Client uploads documents requested by admin
router.patch(
  "/visa-applications/:id/additional-documents",
  requireAuth,
  async (req, res): Promise<void> => {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) {
      res.status(400).json({ error: "Invalid application id" });
      return;
    }

    const { documents } = req.body ?? {};
    if (!Array.isArray(documents)) {
      res.status(400).json({ error: "documents must be an array" });
      return;
    }

    const [existing] = await db
      .select()
      .from(visaApplicationsTable)
      .where(eq(visaApplicationsTable.id, id));

    if (!existing) {
      res.status(404).json({ error: "Visa application not found" });
      return;
    }

    if (existing.userId !== req.session.userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    // Merge with existing uploads (avoid duplicates by name)
    const existing_urls: Array<{ name: string; url: string; uploadedAt: string }> =
      (existing.additionalDocumentUrls as any) ?? [];

    const merged = [...existing_urls];
    for (const doc of documents) {
      if (!doc.name || !doc.url) continue;
      const idx = merged.findIndex(u => u.name === doc.name);
      const entry = { name: doc.name, url: doc.url, uploadedAt: new Date().toISOString() };
      if (idx >= 0) merged[idx] = entry;
      else merged.push(entry);
    }

    const [updated] = await db
      .update(visaApplicationsTable)
      .set({ additionalDocumentUrls: merged })
      .where(eq(visaApplicationsTable.id, id))
      .returning();

    const [visa] = await db.select().from(visasTable).where(eq(visasTable.id, updated.visaId));
    res.json(withVisa(updated, visa));
  },
);

export default router;
