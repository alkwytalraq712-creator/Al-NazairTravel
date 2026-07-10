import {
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
import { packagesTable } from "./packages";

export const packageBookingsTable = pgTable("package_bookings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id),
  packageId: integer("package_id")
    .notNull()
    .references(() => packagesTable.id),
  referenceNumber: text("reference_number").notNull().unique(),
  travelersCount: integer("travelers_count").notNull(),
  travelerNames: text("traveler_names").array().notNull(),
  passportNumbers: text("passport_numbers").array().notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  travelDate: date("travel_date", { mode: "string" }).notNull(),
  notes: text("notes"),
  status: text("status").notNull().default("received"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertPackageBookingSchema = createInsertSchema(
  packageBookingsTable,
).omit({
  id: true,
  createdAt: true,
  referenceNumber: true,
  status: true,
  userId: true,
});
export type InsertPackageBooking = z.infer<typeof insertPackageBookingSchema>;
export type PackageBooking = typeof packageBookingsTable.$inferSelect;
