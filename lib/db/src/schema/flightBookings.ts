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
  /** Per-passenger e-ticket number issued by the provider, when available. */
  eTicketNumber?: string;
}

/** A single flight segment as issued by the provider — richer than the search offer. */
export interface FlightSegmentInfo {
  fromAirport: string;
  fromAirportName?: string;
  fromCity?: string;
  toAirport: string;
  toAirportName?: string;
  toCity?: string;
  departTime: string;
  arriveTime: string;
  airlineName?: string;
  airlineLogoUrl?: string;
  flightNumber?: string;
  aircraft?: string;
  durationMinutes?: number;
  cabinClass?: string;
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
  // ── Provider (Duffel) order data ──
  /** "duffel" when a real order was created, "local" when only stored locally. */
  provider: text("provider").notNull().default("local"),
  /** "test" | "live" | "unknown" — the mode the order was created in. */
  providerMode: text("provider_mode"),
  /** The real airline booking reference (PNR) issued by the provider. */
  bookingReference: text("booking_reference"),
  /** The provider's internal order id (e.g. Duffel ord_...). */
  duffelOrderId: text("duffel_order_id"),
  /** E-ticket / document numbers issued by the provider. */
  eticketNumbers: jsonb("eticket_numbers").$type<string[]>(),
  /** Full per-segment info issued by the provider (airports, cities, cabin, etc.). */
  segments: jsonb("segments").$type<FlightSegmentInfo[]>(),
  /** Human-readable baggage allowance summary. */
  baggage: text("baggage"),
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
