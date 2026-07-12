import {
  doublePrecision,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { flightBookingsTable } from "./flightBookings";
import { packageBookingsTable } from "./packageBookings";
import { visaApplicationsTable } from "./visaApplications";

export const paymentsTable = pgTable("payments", {
  id: serial("id").primaryKey(),
  referenceNumber: text("reference_number").notNull().unique(),
  bookingType: text("booking_type").notNull(), // flight | package | visa | other
  flightBookingId: integer("flight_booking_id").references(
    () => flightBookingsTable.id,
  ),
  packageBookingId: integer("package_booking_id").references(
    () => packageBookingsTable.id,
  ),
  visaApplicationId: integer("visa_application_id").references(
    () => visaApplicationsTable.id,
  ),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  amount: doublePrecision("amount").notNull(),
  currency: text("currency").notNull().default("IQD"),
  method: text("method").notNull().default("cash"), // cash | bank_transfer | card | other
  status: text("status").notNull().default("pending"), // pending | paid | refunded | failed
  transactionId: text("transaction_id"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertPaymentSchema = createInsertSchema(paymentsTable).omit({
  id: true,
  createdAt: true,
  referenceNumber: true,
});
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof paymentsTable.$inferSelect;
