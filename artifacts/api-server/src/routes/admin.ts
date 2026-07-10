import { Router, type IRouter } from "express";
import { desc, eq, sql } from "drizzle-orm";
import {
  db,
  usersTable,
  visaApplicationsTable,
  packageBookingsTable,
  flightBookingsTable,
} from "@workspace/db";
import {
  ListCustomersResponse,
  GetCustomerParams,
  GetCustomerResponse,
  GetAdminDashboardSummaryResponse,
} from "@workspace/api-zod";
import { requireAdmin } from "../lib/auth";
import { serializeUser } from "../lib/auth";

const router: IRouter = Router();

router.get("/admin/customers", requireAdmin, async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.role, "customer"))
    .orderBy(desc(usersTable.createdAt));

  res.json(ListCustomersResponse.parse(rows.map(serializeUser)));
});

router.get(
  "/admin/customers/:id",
  requireAdmin,
  async (req, res): Promise<void> => {
    const params = GetCustomerParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, params.data.id));

    if (!user) {
      res.status(404).json({ error: "Customer not found" });
      return;
    }

    res.json(GetCustomerResponse.parse(serializeUser(user)));
  },
);

router.get(
  "/admin/dashboard",
  requireAdmin,
  async (_req, res): Promise<void> => {
    const [{ count: totalCustomers }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(usersTable)
      .where(eq(usersTable.role, "customer"));

    const [{ count: totalVisaApplications }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(visaApplicationsTable);
    const [{ count: pendingVisaApplications }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(visaApplicationsTable)
      .where(sql`${visaApplicationsTable.status} NOT IN ('completed', 'rejected')`);

    const [{ count: totalPackageBookings }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(packageBookingsTable);
    const [{ count: pendingPackageBookings }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(packageBookingsTable)
      .where(sql`${packageBookingsTable.status} NOT IN ('completed', 'cancelled')`);

    const [{ count: totalFlightBookings }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(flightBookingsTable);
    const [{ count: pendingFlightBookings }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(flightBookingsTable)
      .where(sql`${flightBookingsTable.status} NOT IN ('completed', 'cancelled')`);

    const recentVisaApps = await db
      .select()
      .from(visaApplicationsTable)
      .orderBy(desc(visaApplicationsTable.createdAt))
      .limit(5);
    const recentPackageBookings = await db
      .select()
      .from(packageBookingsTable)
      .orderBy(desc(packageBookingsTable.createdAt))
      .limit(5);
    const recentFlightBookings = await db
      .select()
      .from(flightBookingsTable)
      .orderBy(desc(flightBookingsTable.createdAt))
      .limit(5);

    const recentActivity = [
      ...recentVisaApps.map((a) => ({
        type: "visa_application",
        description: `Visa application ${a.referenceNumber} (${a.status})`,
        createdAt: a.createdAt,
      })),
      ...recentPackageBookings.map((b) => ({
        type: "package_booking",
        description: `Package booking ${b.referenceNumber} (${b.status})`,
        createdAt: b.createdAt,
      })),
      ...recentFlightBookings.map((b) => ({
        type: "flight_booking",
        description: `Flight booking ${b.referenceNumber} (${b.status})`,
        createdAt: b.createdAt,
      })),
    ]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10);

    res.json(
      GetAdminDashboardSummaryResponse.parse({
        totalCustomers,
        totalVisaApplications,
        pendingVisaApplications,
        totalPackageBookings,
        pendingPackageBookings,
        totalFlightBookings,
        pendingFlightBookings,
        recentActivity,
      }),
    );
  },
);

export default router;
