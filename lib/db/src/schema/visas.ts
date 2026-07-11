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
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),

  // ── Per-country requirements (configurable from admin) ────────────────────
  requiresGulfResidence:  boolean("requires_gulf_residence").notNull().default(false),
  requiresPersonalPhoto:  boolean("requires_personal_photo").notNull().default(true),
  requiresPassportImage:  boolean("requires_passport_image").notNull().default(true),
  requiresBankStatement:  boolean("requires_bank_statement").notNull().default(false),
  requiresFlightBooking:  boolean("requires_flight_booking").notNull().default(false),
  requiresHotelBooking:   boolean("requires_hotel_booking").notNull().default(false),
  requiresTravelInsurance:boolean("requires_travel_insurance").notNull().default(false),
  requiresAdditionalDocs: boolean("requires_additional_docs").notNull().default(false),
});

export const insertVisaSchema = createInsertSchema(visasTable).omit({
  id: true,
  createdAt: true,
});
export type InsertVisa = z.infer<typeof insertVisaSchema>;
export type Visa = typeof visasTable.$inferSelect;
