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

/** Ensures the release-tracking table exists on deployments without pre-deploy migrations. */
export async function ensureAppReleasesTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_releases (
      id SERIAL PRIMARY KEY,
      platform TEXT NOT NULL DEFAULT 'android',
      version TEXT NOT NULL,
      version_code INTEGER NOT NULL,
      download_url TEXT NOT NULL,
      release_notes TEXT NOT NULL DEFAULT '',
      is_mandatory BOOLEAN NOT NULL DEFAULT FALSE,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT app_releases_platform_version_unique UNIQUE (platform, version)
    )
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS app_releases_active_platform_idx ON app_releases (platform, is_active, version_code DESC)`);
}

export * from "./schema";
