import { pgTable, serial, text, boolean, integer, timestamp } from "drizzle-orm/pg-core";

export const branchTable = pgTable("branches", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  country: text("country").notNull().default(""),
  city: text("city").notNull().default(""),
  address: text("address").notNull().default(""),
  googleMapsUrl: text("google_maps_url"),
  phone: text("phone"),
  whatsapp: text("whatsapp"),
  email: text("email"),
  workHours: text("work_hours"),
  workDays: text("work_days"),
  imageUrl: text("image_url"),
  /** open | closed */
  status: text("status").notNull().default("open"),
  isVisible: boolean("is_visible").notNull().default(true),
  isMain: boolean("is_main").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Branch = typeof branchTable.$inferSelect;
export type NewBranch = typeof branchTable.$inferInsert;
