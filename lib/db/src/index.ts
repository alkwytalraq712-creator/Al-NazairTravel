import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool, types } = pg;

// PostgreSQL returns NUMERIC/DECIMAL columns as strings by default.
// Parse them as JS floats so Zod response schemas (z.number()) pass cleanly.
types.setTypeParser(types.builtins.NUMERIC, parseFloat);
// INT8 (bigint) also returns as string; parse as integer.
types.setTypeParser(types.builtins.INT8, (v) => parseInt(v, 10));

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

export * from "./schema";
