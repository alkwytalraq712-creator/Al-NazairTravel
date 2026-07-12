ALTER TABLE "payments"
  ALTER COLUMN "amount" TYPE double precision USING "amount"::double precision;

ALTER TABLE "invoices"
  ALTER COLUMN "subtotal" TYPE double precision USING "subtotal"::double precision,
  ALTER COLUMN "tax" TYPE double precision USING "tax"::double precision,
  ALTER COLUMN "total" TYPE double precision USING "total"::double precision;
