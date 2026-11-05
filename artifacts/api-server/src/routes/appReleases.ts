import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { appReleasesTable, db, notificationsTable, usersTable } from "@workspace/db";
import { requireAdmin, requirePermission } from "../lib/auth";
import { sendExpoPush } from "./notifications";

const router: IRouter = Router();

const releaseBody = z.object({
  platform: z.enum(["android", "ios"]).default("android"),
  version: z.string().trim().regex(/^\d+\.\d+\.\d+$/, "الإصدار يجب أن يكون بصيغة 1.0.0"),
  versionCode: z.coerce.number().int().positive(),
  downloadUrl: z.string().url(),
  releaseNotes: z.string().trim().max(5000).default(""),
  isMandatory: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

function versionParts(version: string): number[] {
  return version.split(".").map((part) => Number(part));
}

function compareVersions(left: string, right: string): number {
  const a = versionParts(left);
  const b = versionParts(right);
  for (let i = 0; i < 3; i += 1) {
    if (a[i] !== b[i]) return a[i] - b[i];
  }
  return 0;
}

// Public endpoint consumed by the Android app. It never exposes inactive releases.
router.get("/app-updates/latest", async (req, res): Promise<void> => {
  const platform = req.query.platform === "ios" ? "ios" : "android";
  const currentVersion = typeof req.query.version === "string" ? req.query.version : "0.0.0";
  const [latest] = await db
    .select()
    .from(appReleasesTable)
    .where(and(eq(appReleasesTable.platform, platform), eq(appReleasesTable.isActive, true)))
    .orderBy(desc(appReleasesTable.versionCode))
    .limit(1);

  if (!latest || compareVersions(latest.version, currentVersion) <= 0) {
    res.json({ updateAvailable: false });
    return;
  }

  res.json({
    updateAvailable: true,
    release: {
      id: latest.id,
      platform: latest.platform,
      version: latest.version,
      versionCode: latest.versionCode,
      downloadUrl: latest.downloadUrl,
      releaseNotes: latest.releaseNotes,
      isMandatory: latest.isMandatory,
    },
  });
});

router.get(
  "/admin/app-releases",
  requireAdmin,
  requirePermission("reports.view"),
  async (_req, res): Promise<void> => {
    const releases = await db
      .select()
      .from(appReleasesTable)
      .orderBy(desc(appReleasesTable.versionCode), desc(appReleasesTable.createdAt));
    res.json(releases);
  },
);

router.post(
  "/admin/app-releases",
  requireAdmin,
  requirePermission("reports.view"),
  async (req, res): Promise<void> => {
    const parsed = releaseBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? "بيانات الإصدار غير صحيحة" });
      return;
    }

    const existing = await db
      .select({ id: appReleasesTable.id })
      .from(appReleasesTable)
      .where(and(eq(appReleasesTable.platform, parsed.data.platform), eq(appReleasesTable.version, parsed.data.version)))
      .limit(1);
    if (existing[0]) {
      res.status(409).json({ error: "هذا الإصدار مسجل مسبقاً لهذه المنصة" });
      return;
    }

    const [release] = await db.insert(appReleasesTable).values(parsed.data).returning();
    if (!release) {
      res.status(500).json({ error: "تعذر حفظ الإصدار" });
      return;
    }

    // Notify customers only for an active release, and keep the notification in
    // the same database so users can see it even if push delivery is unavailable.
    if (release.isActive) {
      const [latestCustomerRelease] = await db
        .select({ version: appReleasesTable.version })
        .from(appReleasesTable)
        .where(and(eq(appReleasesTable.platform, release.platform), eq(appReleasesTable.isActive, true)))
        .orderBy(desc(appReleasesTable.versionCode))
        .limit(1);
      if (latestCustomerRelease?.version === release.version) {
        await db.insert(notificationsTable).values({
          userId: null,
          title: `تحديث جديد للتطبيق ${release.version}`,
          message: release.isMandatory ? "يتوفر تحديث مهم. يرجى تحديث التطبيق للمتابعة." : "يتوفر إصدار جديد من التطبيق مع تحسينات وإصلاحات.",
          type: "system",
          data: {
            kind: "app_update",
            version: release.version,
            versionCode: String(release.versionCode),
            downloadUrl: release.downloadUrl,
            isMandatory: String(release.isMandatory),
          },
        });
        const customers = await db
          .select({ token: usersTable.expoPushToken })
          .from(usersTable)
          .where(eq(usersTable.role, "customer"));
        const tokens = customers.map((customer) => customer.token).filter(Boolean) as string[];
        await sendExpoPush(tokens, `تحديث جديد للتطبيق ${release.version}`, release.isMandatory ? "يرجى تحديث التطبيق للمتابعة." : "يتوفر إصدار جديد مع تحسينات وإصلاحات.", {
          kind: "app_update",
          version: release.version,
          downloadUrl: release.downloadUrl,
          isMandatory: String(release.isMandatory),
        });
      }
    }

    res.status(201).json(release);
  },
);

router.patch(
  "/admin/app-releases/:id/active",
  requireAdmin,
  requirePermission("reports.view"),
  async (req, res): Promise<void> => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: "معرف الإصدار غير صحيح" });
      return;
    }
    const active = z.object({ isActive: z.boolean() }).safeParse(req.body);
    if (!active.success) {
      res.status(400).json({ error: "قيمة حالة الإصدار غير صحيحة" });
      return;
    }
    const [updated] = await db
      .update(appReleasesTable)
      .set({ isActive: active.data.isActive })
      .where(eq(appReleasesTable.id, id))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "الإصدار غير موجود" });
      return;
    }
    res.json(updated);
  },
);

export default router;
