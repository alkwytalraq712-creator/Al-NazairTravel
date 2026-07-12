import { boolean, doublePrecision, integer, pgTable, timestamp } from "drizzle-orm/pg-core";

/**
 * Singleton settings row (id = 1) controlling the Hold Booking feature.
 * Managed by admin via /api/admin/settings/hold.
 */
export const holdSettingsTable = pgTable("hold_settings", {
  id:               integer("id").primaryKey().default(1),
  holdEnabled:      boolean("hold_enabled").notNull().default(true),
  /** Fee charged to the customer for holding a booking (non-refundable). */
  holdFeeAmount:    doublePrecision("hold_fee_amount").notNull().default(25),
  /** How many hours the hold is valid before auto-expiry. */
  holdDurationHours: integer("hold_duration_hours").notNull().default(24),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type HoldSettings = typeof holdSettingsTable.$inferSelect;
