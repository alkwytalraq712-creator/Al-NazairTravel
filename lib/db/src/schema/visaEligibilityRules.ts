import { pgTable, serial, integer, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { visasTable } from "./visas";

export const visaEligibilityRuleTable = pgTable("visa_eligibility_rules", {
  id: serial("id").primaryKey(),
  visaId: integer("visa_id")
    .notNull()
    .references(() => visasTable.id, { onDelete: "cascade" }),
  name: text("name").notNull().default(""),
  /** If true, this rule matches all nationalities not matched by a specific rule. */
  isDefault: boolean("is_default").notNull().default(false),
  /** Empty array = not used for matching (must use isDefault instead). */
  nationalities: text("nationalities").array().notNull().default([]),
  /** If true, users matching this rule are allowed immediately with no further requirements. */
  allowDirect: boolean("allow_direct").notNull().default(false),
  requiresGulfResidence: boolean("requires_gulf_residence").notNull().default(false),
  /** OR-logic: user needs a valid visa for at least one of these countries. Values: schengen, uk, us, canada, australia, japan, newzealand, southkorea */
  requiresValidVisaCountries: text("requires_valid_visa_countries").array().notNull().default([]),
  /** AND-logic: always surfaced as an informational blocker in addition to the OR conditions. */
  requiresInvitationLetter: boolean("requires_invitation_letter").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type VisaEligibilityRule = typeof visaEligibilityRuleTable.$inferSelect;
export type NewVisaEligibilityRule = typeof visaEligibilityRuleTable.$inferInsert;
