ALTER TABLE "visas"
  ALTER COLUMN "price" TYPE double precision USING "price"::double precision;
