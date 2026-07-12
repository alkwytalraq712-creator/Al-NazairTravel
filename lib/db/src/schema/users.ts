import { boolean, jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// ── JSONB sub-types ───────────────────────────────────────────────────────────

export interface ActiveVisa {
  country: string;
  visaType: string;
  visaNumber?: string;
  issueDate?: string;  // YYYY-MM-DD
  expiryDate: string;  // YYYY-MM-DD
  imageUrl?: string;
}

export interface TravelTrip {
  country: string;
  entryDate: string;  // YYYY-MM-DD
  exitDate: string;   // YYYY-MM-DD
}

// ── Table ─────────────────────────────────────────────────────────────────────

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull().unique(),
  email: text("email"),
  passwordHash: text("password_hash").notNull(),
  avatarUrl: text("avatar_url"),
  role: text("role").notNull().default("customer"), // customer | admin
  language: text("language").notNull().default("ar"),
  currency: text("currency").notNull().default("USD"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),

  // ── Personal profile ──────────────────────────────────────────────────────
  firstName: text("first_name"),
  fatherName: text("father_name"),
  grandfatherName: text("grandfather_name"),
  familyName: text("family_name"),
  englishName: text("english_name"),
  gender: text("gender"),
  dob: text("dob"), // YYYY-MM-DD stored as text
  nationality: text("nationality"),
  placeOfBirth: text("place_of_birth"),
  maritalStatus: text("marital_status"),
  occupation: text("occupation"),
  whatsapp: text("whatsapp"),
  address: text("address"),

  // ── Passport ─────────────────────────────────────────────────────────────
  passportNumber: text("passport_number"),
  passportIssuingCountry: text("passport_issuing_country"),
  passportIssuingPlace: text("passport_issuing_place"),
  passportIssueDate: text("passport_issue_date"), // YYYY-MM-DD
  passportExpiry: text("passport_expiry"),         // YYYY-MM-DD
  passportImageUrl: text("passport_image_url"),

  // ── Gulf residence (legacy — kept for DB compat) ──────────────────────────
  hasGulfResidence: boolean("has_gulf_residence").notNull().default(false),
  gulfResidenceCountry: text("gulf_residence_country"),
  gulfResidenceNumber: text("gulf_residence_number"),
  gulfResidenceExpiry: text("gulf_residence_expiry"),  // YYYY-MM-DD
  gulfResidenceFrontUrl: text("gulf_residence_front_url"),
  gulfResidenceBackUrl: text("gulf_residence_back_url"),

  // ── Residence type (new simplified flow) ─────────────────────────────────
  // 'none' | 'gcc' | 'schengen' | 'uk' | 'usa'
  residenceType: text("residence_type").notNull().default("none"),

  // ── Active foreign visas (JSON array of ActiveVisa) ───────────────────────
  hasActiveForeignVisa: boolean("has_active_foreign_visa").notNull().default(false),
  activeVisas: jsonb("active_visas").notNull().default([]).$type<ActiveVisa[]>(),

  // ── Travel history (JSON array of TravelTrip, last 5 years) ──────────────
  hasTravelHistory: boolean("has_travel_history").notNull().default(false),
  travelHistory: jsonb("travel_history").notNull().default([]).$type<TravelTrip[]>(),

  // ── Completion tracking ───────────────────────────────────────────────────
  profileCompletedAt: timestamp("profile_completed_at", { withTimezone: true }),

  // ── Staff permissions ─────────────────────────────────────────────────────
  // null = full access (admin/owner). Array of module keys for staff employees.
  permissions: jsonb("permissions").$type<string[]>(),

  // ── Push notifications ────────────────────────────────────────────────────
  expoPushToken: text("expo_push_token"),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({
  id: true,
  createdAt: true,
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
