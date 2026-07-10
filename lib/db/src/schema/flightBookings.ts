import { integer, jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export interface FlightOfferSnapshot {
  id: string;
  airlineName: string;
  airlineLogoUrl: string;
  flightNumber: string;
  fromAirport: string;
  toAirport: string;
  departTime: string;
  arriveTime: string;
  durationMinutes: number;
  stops: number;
  cabinClass: string;
  price: number;
  currency: string;
}

export interface FlightPassenger {
  firstName: string;
  lastName: string;
  nationality: string;
  gender: string;
  dob: string;
  passportNumber: string;
  passportExpiry: string;
  passportIssueCountry?: string;
}

export const flightBookingsTable = pgTable("flight_bookings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id),
  referenceNumber: text("reference_number").notNull().unique(),
  offer: jsonb("offer").$type<FlightOfferSnapshot>().notNull(),
  passengers: jsonb("passengers").$type<FlightPassenger[]>().notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertFlightBookingSchema = createInsertSchema(
  flightBookingsTable,
).omit({
  id: true,
  createdAt: true,
  referenceNumber: true,
  status: true,
  userId: true,
});
export type InsertFlightBooking = z.infer<typeof insertFlightBookingSchema>;
export type FlightBooking = typeof flightBookingsTable.$inferSelect;
