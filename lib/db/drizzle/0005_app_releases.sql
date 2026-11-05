CREATE TABLE IF NOT EXISTS "app_releases" (
  "id" serial PRIMARY KEY NOT NULL,
  "platform" text DEFAULT 'android' NOT NULL,
  "version" text NOT NULL,
  "version_code" integer NOT NULL,
  "download_url" text NOT NULL,
  "release_notes" text DEFAULT '' NOT NULL,
  "is_mandatory" boolean DEFAULT false NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "app_releases_platform_version_unique" UNIQUE("platform", "version")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "app_releases_active_platform_idx" ON "app_releases" USING btree ("platform", "is_active", "version_code" DESC);
