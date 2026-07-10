import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, packageBookingsTable, packagesTable } from "@workspace/db";
import {
  ListMyPackageBookingsResponse,
  CreatePackageBookingBody,
  CreatePackageBookingResponse,
  GetPackageBookingParams,
  GetPackageBookingResponse,
  ListAllPackageBookingsQueryParams,
  ListAllPackageBookingsResponse,
  UpdatePackageBookingStatusParams,
  UpdatePackageBookingStatusBody,
  UpdatePackageBookingStatusResponse,
} from "@workspace/api-zod";
import { requireAdmin, requireAuth } from "../lib/auth";
import { generateReferenceNumber } from "../lib/reference";

const router: IRouter = Router();

function withPackage<T>(row: T, pkg: unknown) {
  return { ...row, package: pkg ?? null };
}

router.get(
  "/package-bookings",
  requireAuth,
  async (req, res): Promise<void> => {
    const rows = await db
      .select({ booking: packageBookingsTable, pkg: packagesTable })
      .from(packageBookingsTable)
      .leftJoin(packagesTable, eq(packageBookingsTable.packageId, packagesTable.id))
      .where(eq(packageBookingsTable.userId, req.session.userId as number))
      .orderBy(desc(packageBookingsTable.createdAt));

    res.json(
      ListMyPackageBookingsResponse.parse(
        rows.map((r) => withPackage(r.booking, r.pkg)),
      ),
    );
  },
);

router.post(
  "/package-bookings",
  requireAuth,
  async (req, res): Promise<void> => {
    const parsed = CreatePackageBookingBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const [booking] = await db
      .insert(packageBookingsTable)
      .values({
        ...parsed.data,
        travelDate: parsed.data.travelDate.toISOString().slice(0, 10),
        userId: req.session.userId as number,
        referenceNumber: generateReferenceNumber("PKG"),
      })
      .returning();

    const [pkg] = await db
      .select()
      .from(packagesTable)
      .where(eq(packagesTable.id, booking.packageId));

    res
      .status(201)
      .json(CreatePackageBookingResponse.parse(withPackage(booking, pkg)));
  },
);

router.get(
  "/package-bookings/:id",
  requireAuth,
  async (req, res): Promise<void> => {
    const params = GetPackageBookingParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const [row] = await db
      .select({ booking: packageBookingsTable, pkg: packagesTable })
      .from(packageBookingsTable)
      .leftJoin(packagesTable, eq(packageBookingsTable.packageId, packagesTable.id))
      .where(eq(packageBookingsTable.id, params.data.id));

    if (!row) {
      res.status(404).json({ error: "Package booking not found" });
      return;
    }

    res.json(GetPackageBookingResponse.parse(withPackage(row.booking, row.pkg)));
  },
);

router.get(
  "/admin/package-bookings",
  requireAdmin,
  async (req, res): Promise<void> => {
    const query = ListAllPackageBookingsQueryParams.safeParse(req.query);
    if (!query.success) {
      res.status(400).json({ error: query.error.message });
      return;
    }

    const rows = await db
      .select({ booking: packageBookingsTable, pkg: packagesTable })
      .from(packageBookingsTable)
      .leftJoin(packagesTable, eq(packageBookingsTable.packageId, packagesTable.id))
      .where(
        query.data.status
          ? eq(packageBookingsTable.status, query.data.status)
          : undefined,
      )
      .orderBy(desc(packageBookingsTable.createdAt));

    res.json(
      ListAllPackageBookingsResponse.parse(
        rows.map((r) => withPackage(r.booking, r.pkg)),
      ),
    );
  },
);

router.patch(
  "/admin/package-bookings/:id/status",
  requireAdmin,
  async (req, res): Promise<void> => {
    const params = UpdatePackageBookingStatusParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const parsed = UpdatePackageBookingStatusBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const [booking] = await db
      .update(packageBookingsTable)
      .set({ status: parsed.data.status })
      .where(eq(packageBookingsTable.id, params.data.id))
      .returning();

    if (!booking) {
      res.status(404).json({ error: "Package booking not found" });
      return;
    }

    const [pkg] = await db
      .select()
      .from(packagesTable)
      .where(eq(packagesTable.id, booking.packageId));

    res.json(
      UpdatePackageBookingStatusResponse.parse(withPackage(booking, pkg)),
    );
  },
);

export default router;
