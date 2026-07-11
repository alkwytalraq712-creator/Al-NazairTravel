import {
  boolean,
  date,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { visasTable } from "./visas";

export const visaApplicationsTable = pgTable("visa_applications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id),
  visaId: integer("visa_id")
    .notNull()
    .references(() => visasTable.id),
  referenceNumber: text("reference_number").notNull().unique(),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  nationality: text("nationality").notNull(),
  passportNumber: text("passport_number").notNull(),
  passportExpiry: date("passport_expiry", { mode: "string" }).notNull(),
  dob: date("dob", { mode: "string" }).notNull(),
  gender: text("gender").notNull(),
  occupation: text("occupation").notNull(),
  city: text("city").notNull(),
  passportImageUrl: text("passport_image_url"),
  personalPhotoUrl: text("personal_photo_url"),
  status: text("status").notNull().default("received"),
  // OCR-enriched passport fields
  passportType: text("passport_type"),
  issuingCountry: text("issuing_country"),
  passportIssueDate: date("passport_issue_date", { mode: "string" }),
  placeOfBirth: text("place_of_birth"),
  mrz: text("mrz"),
  ocrConfidence: integer("ocr_confidence"),
  ocrVerified: boolean("ocr_verified").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertVisaApplicationSchema = createInsertSchema(
  visaApplicationsTable,
).omit({
  id: true,
  createdAt: true,
  referenceNumber: true,
  status: true,
  userId: true,
});
export type InsertVisaApplication = z.infer<
  typeof insertVisaApplicationSchema
>;
export type VisaApplication = typeof visaApplicationsTable.$inferSelect;
