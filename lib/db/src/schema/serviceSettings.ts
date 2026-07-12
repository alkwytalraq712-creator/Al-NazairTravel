import { boolean, integer, pgTable, timestamp } from "drizzle-orm/pg-core";

/**
 * Singleton table (id=1) — controls which services are visible in the mobile app.
 * Admin can toggle flights / packages / visas on or off without a code deploy.
 */
export const serviceSettingsTable = pgTable("service_settings", {
  id:              integer("id").primaryKey().default(1),
  flightsEnabled:  boolean("flights_enabled").notNull().default(true),
  packagesEnabled: boolean("packages_enabled").notNull().default(true),
  visasEnabled:    boolean("visas_enabled").notNull().default(true),
  updatedAt:       timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ServiceSettings       = typeof serviceSettingsTable.$inferSelect;
export type ServiceSettingsUpdate = Partial<Omit<ServiceSettings, "id" | "updatedAt">>;
