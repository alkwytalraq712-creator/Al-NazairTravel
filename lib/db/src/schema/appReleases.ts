import { boolean, integer, pgTable, serial, text, timestamp, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const appReleasesTable = pgTable(
  "app_releases",
  {
    id: serial("id").primaryKey(),
    platform: text("platform").notNull().default("android"),
    version: text("version").notNull(),
    versionCode: integer("version_code").notNull(),
    downloadUrl: text("download_url").notNull(),
    releaseNotes: text("release_notes").notNull().default(""),
    isMandatory: boolean("is_mandatory").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    platformVersionUnique: unique("app_releases_platform_version_unique").on(table.platform, table.version),
  }),
);

export const insertAppReleaseSchema = createInsertSchema(appReleasesTable).omit({
  id: true,
  createdAt: true,
});
export type InsertAppRelease = z.infer<typeof insertAppReleaseSchema>;
export type AppRelease = typeof appReleasesTable.$inferSelect;
