import { Router, type IRouter } from "express";
import { desc, eq, isNull, or } from "drizzle-orm";
import { db, notificationsTable } from "@workspace/db";
import {
  ListMyNotificationsResponse,
  MarkNotificationReadParams,
  MarkNotificationReadResponse,
  ListAllNotificationsResponse,
  SendNotificationBody,
  SendNotificationResponse,
} from "@workspace/api-zod";
import { requireAdmin, requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.get(
  "/notifications",
  requireAuth,
  async (req, res): Promise<void> => {
    const rows = await db
      .select()
      .from(notificationsTable)
      .where(
        or(
          eq(notificationsTable.userId, req.session.userId as number),
          isNull(notificationsTable.userId),
        ),
      )
      .orderBy(desc(notificationsTable.createdAt));

    res.json(ListMyNotificationsResponse.parse(rows));
  },
);

router.patch(
  "/notifications/:id/read",
  requireAuth,
  async (req, res): Promise<void> => {
    const params = MarkNotificationReadParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    // Fetch first to verify ownership
    const [existing] = await db
      .select()
      .from(notificationsTable)
      .where(eq(notificationsTable.id, params.data.id));

    if (!existing) {
      res.status(404).json({ error: "Notification not found" });
      return;
    }

    // Allow marking read only if it belongs to this user or is a broadcast (userId = null)
    if (existing.userId !== null && existing.userId !== req.session.userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const [notification] = await db
      .update(notificationsTable)
      .set({ isRead: true })
      .where(eq(notificationsTable.id, params.data.id))
      .returning();

    if (!notification) {
      res.status(404).json({ error: "Notification not found" });
      return;
    }

    res.json(MarkNotificationReadResponse.parse(notification));
  },
);

router.get(
  "/admin/notifications",
  requireAdmin,
  async (_req, res): Promise<void> => {
    const rows = await db
      .select()
      .from(notificationsTable)
      .orderBy(desc(notificationsTable.createdAt));

    res.json(ListAllNotificationsResponse.parse(rows));
  },
);

router.post(
  "/admin/notifications",
  requireAdmin,
  async (req, res): Promise<void> => {
    const parsed = SendNotificationBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const [notification] = await db
      .insert(notificationsTable)
      .values(parsed.data)
      .returning();

    res.status(201).json(SendNotificationResponse.parse(notification));
  },
);

export default router;
