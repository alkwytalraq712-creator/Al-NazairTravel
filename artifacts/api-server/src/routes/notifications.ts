import { Router, type IRouter } from "express";
import { and, desc, eq, isNull, or } from "drizzle-orm";
import { db, notificationsTable, usersTable } from "@workspace/db";
import {
  ListMyNotificationsResponse,
  MarkNotificationReadParams,
  MarkNotificationReadResponse,
  ListAllNotificationsResponse,
  SendNotificationBody,
  SendNotificationResponse,
} from "@workspace/api-zod";
import { requireAdmin, requireAuth } from "../lib/auth";
import { z } from "zod";

const router: IRouter = Router();

// ─── Send Expo push notifications ────────────────────────────────────────────
async function sendExpoPush(
  tokens: string[],
  title: string,
  body: string,
  data: Record<string, string> = {},
) {
  const valid = tokens.filter((t) => t && t.startsWith("ExponentPushToken"));
  if (valid.length === 0) return;

  const messages = valid.map((to) => ({
    to,
    title,
    body,
    data,
    sound: "default",
    channelId: "default",
  }));

  try {
    const chunkSize = 100; // Expo max per request
    for (let i = 0; i < messages.length; i += chunkSize) {
      const chunk = messages.slice(i, i + chunkSize);
      await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "Accept-Encoding": "gzip, deflate",
        },
        body: JSON.stringify(chunk),
      });
    }
  } catch (e) {
    console.error("[push] Failed to send Expo push:", e);
  }
}

// ─── Register push token ──────────────────────────────────────────────────────
router.post(
  "/notifications/push-token",
  requireAuth,
  async (req, res): Promise<void> => {
    const parsed = z.object({ token: z.string().min(1) }).safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid token" });
      return;
    }
    await db
      .update(usersTable)
      .set({ expoPushToken: parsed.data.token } as any)
      .where(eq(usersTable.id, req.session.userId as number));

    res.json({ ok: true });
  },
);

// ─── List user notifications ──────────────────────────────────────────────────
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

// ─── Mark one notification read ───────────────────────────────────────────────
router.patch(
  "/notifications/:id/read",
  requireAuth,
  async (req, res): Promise<void> => {
    const params = MarkNotificationReadParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const [existing] = await db
      .select()
      .from(notificationsTable)
      .where(eq(notificationsTable.id, params.data.id));

    if (!existing) {
      res.status(404).json({ error: "Notification not found" });
      return;
    }

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

// ─── Delete ALL user notifications ───────────────────────────────────────────
// IMPORTANT: Must be declared BEFORE /notifications/:id to avoid param conflict
router.delete(
  "/notifications/delete-all",
  requireAuth,
  async (req, res): Promise<void> => {
    await db
      .delete(notificationsTable)
      .where(eq(notificationsTable.userId, req.session.userId as number));

    res.json({ ok: true });
  },
);

// ─── Mark ALL notifications read ─────────────────────────────────────────────
router.post(
  "/notifications/read-all",
  requireAuth,
  async (req, res): Promise<void> => {
    await db
      .update(notificationsTable)
      .set({ isRead: true })
      .where(
        and(
          eq(notificationsTable.userId, req.session.userId as number),
          eq(notificationsTable.isRead, false),
        ),
      );

    res.json({ ok: true });
  },
);

// ─── Delete one notification ──────────────────────────────────────────────────
router.delete(
  "/notifications/:id",
  requireAuth,
  async (req, res): Promise<void> => {
    const id = Number(req.params.id);
    if (!id) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }

    const [existing] = await db
      .select()
      .from(notificationsTable)
      .where(eq(notificationsTable.id, id));

    if (!existing) {
      res.status(404).json({ error: "Notification not found" });
      return;
    }

    // Only allow deleting own notifications (not broadcasts)
    if (existing.userId !== req.session.userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    await db
      .delete(notificationsTable)
      .where(eq(notificationsTable.id, id));

    res.json({ ok: true });
  },
);

// ─── Admin: list all notifications ───────────────────────────────────────────
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

// ─── Admin: get push token stats ─────────────────────────────────────────────
router.get(
  "/admin/notifications/push-stats",
  requireAdmin,
  async (_req, res): Promise<void> => {
    const users = await db
      .select({ id: usersTable.id, token: (usersTable as any).expoPushToken })
      .from(usersTable);

    const withToken = users.filter((u) => u.token).length;
    res.json({ totalUsers: users.length, withPushToken: withToken });
  },
);

// ─── Admin: send notification ─────────────────────────────────────────────────
router.post(
  "/admin/notifications",
  requireAdmin,
  async (req, res): Promise<void> => {
    const parsed = SendNotificationBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const { userId, title, message, type, imageUrl, data } = parsed.data as any;

    // Insert into DB
    const [notification] = await db
      .insert(notificationsTable)
      .values({ userId: userId ?? null, title, message, type, imageUrl, data })
      .returning();

    // Send Expo push notification(s)
    const pushData: Record<string, string> = {
      ...(data ?? {}),
      type,
    };

    if (userId) {
      // Targeted: get that user's push token
      const [user] = await db
        .select({ token: (usersTable as any).expoPushToken })
        .from(usersTable)
        .where(eq(usersTable.id, userId));

      if (user?.token) {
        await sendExpoPush([user.token], title, message, pushData);
      }
    } else {
      // Broadcast: get all user push tokens
      const users = await db
        .select({ token: (usersTable as any).expoPushToken })
        .from(usersTable)
        .where(eq(usersTable.role, "customer"));

      const tokens = users.map((u) => u.token).filter(Boolean) as string[];
      await sendExpoPush(tokens, title, message, pushData);
    }

    res.status(201).json(SendNotificationResponse.parse(notification));
  },
);

export default router;
