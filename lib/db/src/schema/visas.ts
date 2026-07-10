import {
  boolean,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const visasTable = pgTable("visas", {
  id: serial("id").primaryKey(),
  countryName: text("country_name").notNull(),
  countryFlagUrl: text("country_flag_url").notNull(),
  countryImageUrl: text("country_image_url").notNull(),
  visaType: text("visa_type").notNull(),
  processingTime: text("processing_time").notNull(),
  stayDuration: text("stay_duration").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull(),
  description: text("description").notNull(),
  requiredDocuments: text("required_documents").array().notNull(),
  entriesAllowed: text("entries_allowed").notNull(),
  validity: text("validity").notNull(),
  isFeatured: boolean("is_featured").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertVisaSchema = createInsertSchema(visasTable).omit({
  id: true,
  createdAt: true,
});
export type InsertVisa = z.infer<typeof insertVisaSchema>;
export type Visa = typeof visasTable.$inferSelect;
