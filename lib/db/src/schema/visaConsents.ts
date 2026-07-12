import { integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";

export const visaConsentTable = pgTable("visa_application_consents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  visaId: integer("visa_id").notNull(),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }).notNull().defaultNow(),
});

export type VisaConsent = typeof visaConsentTable.$inferSelect;
