ALTER TABLE "packages"
  ALTER COLUMN "price_from" TYPE double precision USING "price_from"::double precision,
  ALTER COLUMN "rating" TYPE double precision USING "rating"::double precision,
  ALTER COLUMN "rating" SET DEFAULT 0;
