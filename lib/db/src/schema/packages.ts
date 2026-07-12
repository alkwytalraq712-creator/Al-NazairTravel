import {
  boolean,
  doublePrecision,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export interface ItineraryDay {
  day: number;
  title: string;
  description: string;
}

export const packagesTable = pgTable("packages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  country: text("country").notNull(),
  city: text("city").notNull(),
  days: integer("days").notNull(),
  nights: integer("nights").notNull(),
  priceFrom: doublePrecision("price_from").notNull(),
  currency: text("currency").notNull(),
  rating: doublePrecision("rating").notNull().default(0),
  images: text("images").array().notNull(),
  videoUrl: text("video_url"),
  description: text("description").notNull(),
  hotelsIncluded: text("hotels_included").array().notNull(),
  hotelStars: integer("hotel_stars").notNull(),
  roomType: text("room_type").notNull(),
  meals: text("meals").notNull(),
  transportation: text("transportation").notNull(),
  itinerary: jsonb("itinerary").$type<ItineraryDay[]>().notNull(),
  includedServices: text("included_services").array().notNull(),
  excludedServices: text("excluded_services").array().notNull(),
  cancellationPolicy: text("cancellation_policy").notNull(),
  isFeatured: boolean("is_featured").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertPackageSchema = createInsertSchema(packagesTable).omit({
  id: true,
  createdAt: true,
});
export type InsertPackage = z.infer<typeof insertPackageSchema>;
export type Package = typeof packagesTable.$inferSelect;
