import {
  boolean,
  doublePrecision,
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
  countryCode: text("country_code"),
  countryFlagUrl: text("country_flag_url").notNull(),
  countryImageUrl: text("country_image_url").notNull(),
  visaType: text("visa_type").notNull(),
  processingTime: text("processing_time").notNull(),
  stayDuration: text("stay_duration").notNull(),
  price: doublePrecision("price").notNull(),
  currency: text("currency").notNull(),
  description: text("description").notNull(),
  requiredDocuments: text("required_documents").array().notNull(),
  entriesAllowed: text("entries_allowed").notNull(),
  validity: text("validity").notNull(),
  isFeatured: boolean("is_featured").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),

  // ── Document requirements (configurable from admin) ───────────────────────
  requiresGulfResidence:   boolean("requires_gulf_residence").notNull().default(false),
  requiresPersonalPhoto:   boolean("requires_personal_photo").notNull().default(true),
  requiresPassportImage:   boolean("requires_passport_image").notNull().default(true),
  requiresBankStatement:   boolean("requires_bank_statement").notNull().default(false),
  requiresFlightBooking:   boolean("requires_flight_booking").notNull().default(false),
  requiresHotelBooking:    boolean("requires_hotel_booking").notNull().default(false),
  requiresTravelInsurance: boolean("requires_travel_insurance").notNull().default(false),
  requiresAdditionalDocs:  boolean("requires_additional_docs").notNull().default(false),
  requiresInvitationLetter:boolean("requires_invitation_letter").notNull().default(false),

  // ── Eligibility rules (configurable from admin) ───────────────────────────
  /** Empty array = all nationalities allowed */
  allowedNationalities: text("allowed_nationalities").array().notNull().default([]),
  /** Nationalities that are explicitly blocked */
  blockedNationalities: text("blocked_nationalities").array().notNull().default([]),
  /** If requiresGulfResidence=true AND this is set, user must be resident in this specific country */
  requiresGulfResidenceCountry: text("requires_gulf_residence_country"),
  /**
   * If non-empty, the user must have a valid foreign visa from one of these countries/regions.
   * Values: 'schengen' | 'uk' | 'us' | 'canada' | 'australia' | 'japan' | any ISO country code
   */
  requiresValidVisaCountries: text("requires_valid_visa_countries").array().notNull().default([]),
});

export const insertVisaSchema = createInsertSchema(visasTable).omit({
  id: true,
  createdAt: true,
});
export type InsertVisa = z.infer<typeof insertVisaSchema>;
export type Visa = typeof visasTable.$inferSelect;
