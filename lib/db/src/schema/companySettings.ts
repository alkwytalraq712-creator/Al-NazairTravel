import { pgTable, integer, text, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";

export const companySettingsTable = pgTable("company_settings", {
  id: integer("id").primaryKey().default(1),
  companyName: text("company_name").notNull().default(""),
  logoUrl: text("logo_url"),
  about: text("about"),
  address: text("address"),
  websiteUrl: text("website_url"),
  googleMapsUrl: text("google_maps_url"),
  phonePrimary: text("phone_primary"),
  phoneSecondary: text("phone_secondary"),
  whatsapp: text("whatsapp"),
  emailSupport: text("email_support"),
  emailOfficial: text("email_official"),
  instagram: text("instagram"),
  tiktok: text("tiktok"),
  facebook: text("facebook"),
  twitter: text("twitter"),
  snapchat: text("snapchat"),
  youtube: text("youtube"),
  linkedin: text("linkedin"),
  telegram: text("telegram"),
  workDays: text("work_days"),
  workHours: text("work_hours"),
  weeklyOff: text("weekly_off"),
  extraSocials: jsonb("extra_socials"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type CompanySettings = typeof companySettingsTable.$inferSelect;
