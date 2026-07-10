/**
 * Drizzle returns PostgreSQL `numeric` columns as strings.
 * These helpers coerce them to numbers before Zod parsing.
 */

export function coerceVisa<T extends { price: unknown; rating?: unknown }>(row: T): T {
  return {
    ...row,
    price: row.price != null ? Number(row.price) : row.price,
    rating: row.rating != null ? Number(row.rating) : row.rating,
  };
}

export function coercePkg<T extends { priceFrom: unknown; rating?: unknown }>(row: T): T {
  return {
    ...row,
    priceFrom: row.priceFrom != null ? Number(row.priceFrom) : row.priceFrom,
    rating: row.rating != null ? Number(row.rating) : row.rating,
  };
}
