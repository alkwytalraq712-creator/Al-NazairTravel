/**
 * Integration tests: verify that priceFrom and rating survive the full
 * DB → coerce → Zod → JSON pipeline as JS numbers, not strings.
 *
 * Runs against the real (test) DATABASE_URL. SESSION_SECRET is set in
 * beforeAll so the Express app boots without throwing.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { db, packagesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

// The app guard throws if SESSION_SECRET is missing — set it before import
process.env.SESSION_SECRET = process.env.SESSION_SECRET ?? "test-session-secret-for-integration";

// Dynamic import so the env var is set before the module is evaluated
const { default: app } = await import("../../app.js");

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

const TEST_PRICE_FROM = 1234.5; // exactly representable in IEEE-754 double
const TEST_RATING = 4.5;       // exactly representable in IEEE-754 double

let insertedId: number;

const testPackage = {
  name: "__test_numeric_types__",
  country: "TestCountry",
  city: "TestCity",
  days: 3,
  nights: 2,
  priceFrom: TEST_PRICE_FROM,
  currency: "USD",
  rating: TEST_RATING,
  images: [],
  description: "Integration test package – numeric type assertions",
  hotelsIncluded: [],
  hotelStars: 3,
  roomType: "double",
  meals: "breakfast",
  transportation: "bus",
  itinerary: [],
  includedServices: [],
  excludedServices: [],
  cancellationPolicy: "non-refundable",
  isFeatured: true, // appears in home-summary popularPackages + offers
};

beforeAll(async () => {
  // Drizzle 0.45 infers doublePrecision insert type as string (PgNumeric);
  // the cast lets tests pass numeric literals while Postgres coerces them.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [row] = await db.insert(packagesTable).values(testPackage as any).returning();
  insertedId = row.id;
});

afterAll(async () => {
  if (insertedId) {
    await db.delete(packagesTable).where(eq(packagesTable.id, insertedId));
  }
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("GET /api/home — numeric fields", () => {
  it("responds 200 with valid JSON", async () => {
    const res = await request(app).get("/api/home");
    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
  });

  it("popularPackages items have numeric priceFrom", async () => {
    const res = await request(app).get("/api/home");
    const packages: unknown[] = res.body.popularPackages ?? [];
    // Our seeded package is featured so it must appear
    const seeded = (packages as Array<{ id: number; priceFrom: unknown; rating: unknown }>)
      .find((p) => p.id === insertedId);
    expect(seeded, "seeded package not found in popularPackages").toBeDefined();
    expect(typeof seeded!.priceFrom).toBe("number");
    expect(seeded!.priceFrom).toBeCloseTo(TEST_PRICE_FROM);
  });

  it("popularPackages items have numeric rating", async () => {
    const res = await request(app).get("/api/home");
    const packages = res.body.popularPackages as Array<{ id: number; rating: unknown }>;
    const seeded = packages.find((p) => p.id === insertedId);
    expect(seeded, "seeded package not found in popularPackages").toBeDefined();
    expect(typeof seeded!.rating).toBe("number");
    expect(seeded!.rating).toBeCloseTo(TEST_RATING);
  });

  it("offers items have numeric priceFrom", async () => {
    const res = await request(app).get("/api/home");
    const offers = res.body.offers as Array<{ id: number; priceFrom: unknown }>;
    const seeded = offers?.find((p) => p.id === insertedId);
    expect(seeded, "seeded package not found in offers").toBeDefined();
    expect(typeof seeded!.priceFrom).toBe("number");
    expect(seeded!.priceFrom).toBeCloseTo(TEST_PRICE_FROM);
  });
});

describe("GET /api/packages — numeric fields", () => {
  it("responds 200 with an array", async () => {
    const res = await request(app).get("/api/packages");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("items have numeric priceFrom (not a string)", async () => {
    const res = await request(app).get("/api/packages");
    const packages = res.body as Array<{ id: number; priceFrom: unknown; rating: unknown }>;
    const seeded = packages.find((p) => p.id === insertedId);
    expect(seeded, "seeded package not found in package list").toBeDefined();
    expect(typeof seeded!.priceFrom).toBe("number");
    expect(seeded!.priceFrom).toBeCloseTo(TEST_PRICE_FROM);
  });

  it("items have numeric rating (not a string)", async () => {
    const res = await request(app).get("/api/packages");
    const packages = res.body as Array<{ id: number; rating: unknown }>;
    const seeded = packages.find((p) => p.id === insertedId);
    expect(seeded, "seeded package not found in package list").toBeDefined();
    expect(typeof seeded!.rating).toBe("number");
    expect(seeded!.rating).toBeCloseTo(TEST_RATING);
  });

  it("the Zod schema accepts the response without throwing", async () => {
    // If coerce or schema is broken, parse() throws and this test fails
    const { ListPackagesResponse } = await import("@workspace/api-zod");
    const res = await request(app).get("/api/packages");
    expect(() => ListPackagesResponse.parse(res.body)).not.toThrow();
  });
});

describe("GET /api/packages?minPrice / maxPrice — numeric filter", () => {
  it("filters correctly with a numeric minPrice", async () => {
    const res = await request(app)
      .get("/api/packages")
      .query({ minPrice: 1000, maxPrice: 2000 });
    expect(res.status).toBe(200);
    const packages = res.body as Array<{ id: number; priceFrom: unknown }>;
    const seeded = packages.find((p) => p.id === insertedId);
    expect(seeded, "seeded package should match minPrice=1000 maxPrice=2000").toBeDefined();
  });

  it("excludes package below minPrice", async () => {
    const res = await request(app)
      .get("/api/packages")
      .query({ minPrice: 9999 });
    expect(res.status).toBe(200);
    const packages = res.body as Array<{ id: number }>;
    const seeded = packages.find((p) => p.id === insertedId);
    expect(seeded).toBeUndefined();
  });
});
