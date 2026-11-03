import { Router, type IRouter } from "express";
import { and, desc, eq, sql } from "drizzle-orm";
import {
  db,
  usersTable,
  visaApplicationsTable,
  packageBookingsTable,
  packagesTable,
  flightBookingsTable,
  paymentsTable,
  invoicesTable,
} from "@workspace/db";
import {
  ListCustomersResponse,
  GetCustomerParams,
  GetCustomerResponse,
  GetAdminDashboardSummaryResponse,
  ListEmployeesResponse,
  CreateEmployeeBody,
  CreateEmployeeResponse,
  UpdateEmployeeParams,
  UpdateEmployeeBody,
  UpdateEmployeeResponse,
  DeleteEmployeeParams,
  ListPaymentsResponse,
  CreatePaymentBody,
  CreatePaymentResponse,
  UpdatePaymentParams,
  UpdatePaymentBody,
  UpdatePaymentResponse,
  DeletePaymentParams,
  ListInvoicesResponse,
  CreateInvoiceBody,
  CreateInvoiceResponse,
  UpdateInvoiceParams,
  UpdateInvoiceBody,
  UpdateInvoiceResponse,
  DeleteInvoiceParams,
} from "@workspace/api-zod";
import { requireAdmin, requirePermission, hashPassword, serializeUser } from "../lib/auth";

const router: IRouter = Router();

router.get("/admin/customers", requireAdmin, requirePermission("customers.view"), async (_req, res): Promise<void> => {
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
  requirePermission("customers.view"),
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
  requirePermission("reports.view"),
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

    // Sales report: package bookings do not store a final invoice amount yet,
    // so revenue is explicitly estimated from priceFrom × travelersCount.
    const packageSalesRows = await db
      .select({
        packageId: packageBookingsTable.packageId,
        packageName: packagesTable.name,
        priceFrom: packagesTable.priceFrom,
        currency: packagesTable.currency,
        travelersCount: packageBookingsTable.travelersCount,
        status: packageBookingsTable.status,
        createdAt: packageBookingsTable.createdAt,
      })
      .from(packageBookingsTable)
      .leftJoin(packagesTable, eq(packageBookingsTable.packageId, packagesTable.id));

    const confirmedStatuses = new Set(["confirmed", "paid", "vouchers_issued", "completed"]);
    const statusCounts = new Map<string, number>();
    const revenueByCurrency = new Map<string, number>();
    const packageTotals = new Map<number, {
      packageName: string;
      bookings: number;
      travelers: number;
      estimatedRevenue: number;
      currency: string;
    }>();
    const monthKey = (date: Date) => `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    const monthlyTotals = new Map<string, { bookings: number; travelers: number; estimatedRevenue: number }>();
    const now = new Date();
    for (let offset = 5; offset >= 0; offset -= 1) {
      const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1));
      monthlyTotals.set(monthKey(date), { bookings: 0, travelers: 0, estimatedRevenue: 0 });
    }

    let totalTravelers = 0;
    let confirmedBookings = 0;
    for (const row of packageSalesRows) {
      const travelers = Number(row.travelersCount) || 0;
      const amount = (Number(row.priceFrom) || 0) * travelers;
      const currency = row.currency || "—";
      statusCounts.set(row.status, (statusCounts.get(row.status) ?? 0) + 1);
      totalTravelers += travelers;
      if (confirmedStatuses.has(row.status)) confirmedBookings += 1;
      if (row.status !== "cancelled") {
        revenueByCurrency.set(currency, (revenueByCurrency.get(currency) ?? 0) + amount);
      }

      const currentPackage = packageTotals.get(row.packageId) ?? {
        packageName: row.packageName ?? "باقة غير معروفة",
        bookings: 0,
        travelers: 0,
        estimatedRevenue: 0,
        currency,
      };
      currentPackage.bookings += 1;
      currentPackage.travelers += travelers;
      if (row.status !== "cancelled") currentPackage.estimatedRevenue += amount;
      packageTotals.set(row.packageId, currentPackage);

      const key = monthKey(row.createdAt);
      const month = monthlyTotals.get(key);
      if (month) {
        month.bookings += 1;
        month.travelers += travelers;
        if (row.status !== "cancelled") month.estimatedRevenue += amount;
      }
    }

    const packageSales = {
      totalBookings: packageSalesRows.length,
      totalTravelers,
      confirmedBookings,
      estimatedRevenueByCurrency: Array.from(revenueByCurrency, ([currency, amount]) => ({ currency, amount: Math.round(amount * 100) / 100 })),
      statusBreakdown: Array.from(statusCounts, ([status, count]) => ({ status, count })).sort((a, b) => b.count - a.count),
      monthlyTrend: Array.from(monthlyTotals, ([month, values]) => ({ month, ...values, estimatedRevenue: Math.round(values.estimatedRevenue * 100) / 100 })),
      topPackages: Array.from(packageTotals, ([packageId, values]) => ({ packageId, ...values, estimatedRevenue: Math.round(values.estimatedRevenue * 100) / 100 }))
        .sort((a, b) => b.bookings - a.bookings || b.estimatedRevenue - a.estimatedRevenue)
        .slice(0, 5),
    };

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
        packageSales,
      }),
    );
  },
);

router.get("/admin/employees", requireAdmin, async (req, res): Promise<void> => {
  // Only admin (owner) can manage employees
  const [caller] = await db.select({ role: usersTable.role }).from(usersTable).where(eq(usersTable.id, req.session.userId!));
  if (!caller || caller.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const rows = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.role, "staff"))
    .orderBy(desc(usersTable.createdAt));

  res.json(ListEmployeesResponse.parse(rows.map(serializeUser)));
});

router.post("/admin/employees", requireAdmin, requirePermission("employees.create"), async (req, res): Promise<void> => {
  const parsed = CreateEmployeeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.phone, parsed.data.phone));
  if (existing) {
    res.status(400).json({ error: "رقم الهاتف مسجل مسبقاً" });
    return;
  }

  const passwordHash = await hashPassword(parsed.data.password);

  // Accept optional permissions array from the request body (new granular system)
  const initialPermissions: string[] =
    Array.isArray((req.body as any).permissions)
      ? (req.body as any).permissions
      : [];

  const [employee] = await db
    .insert(usersTable)
    .values({
      fullName: parsed.data.fullName,
      phone: parsed.data.phone,
      email: parsed.data.email,
      passwordHash,
      role: "staff",
      permissions: initialPermissions,
    } as any)
    .returning();

  res.status(201).json(CreateEmployeeResponse.parse(serializeUser(employee)));
});

router.patch(
  "/admin/employees/:id",
  requireAdmin,
  requirePermission("employees.edit"),
  async (req, res): Promise<void> => {
    const params = UpdateEmployeeParams.safeParse(req.params);
    const parsed = UpdateEmployeeBody.safeParse(req.body);
    if (!params.success || !parsed.success) {
      res
        .status(400)
        .json({ error: (params.error ?? parsed.error)!.message });
      return;
    }

    const [existing] = await db
      .select()
      .from(usersTable)
      .where(and(eq(usersTable.id, params.data.id), eq(usersTable.role, "staff")));
    if (!existing) {
      res.status(404).json({ error: "Employee not found" });
      return;
    }

    const { password, ...rest } = parsed.data;
    if (Object.keys(rest).length === 0 && !password) {
      res.status(400).json({ error: "لا توجد بيانات لتحديثها" });
      return;
    }

    if (rest.phone) {
      const [phoneOwner] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.phone, rest.phone));
      if (phoneOwner && phoneOwner.id !== params.data.id) {
        res.status(400).json({ error: "رقم الهاتف مسجل مسبقاً" });
        return;
      }
    }

    const updates: Partial<typeof usersTable.$inferInsert> = { ...rest };
    if (password) {
      updates.passwordHash = await hashPassword(password);
    }

    const [employee] = await db
      .update(usersTable)
      .set(updates)
      .where(eq(usersTable.id, params.data.id))
      .returning();

    res.json(UpdateEmployeeResponse.parse(serializeUser(employee)));
  },
);

// ── Update employee permissions ──────────────────────────────────────────────
router.patch(
  "/admin/employees/:id/permissions",
  requireAdmin,
  async (req, res): Promise<void> => {
    // Only the main admin (owner, role = 'admin') can manage permissions
    const [caller] = await db
      .select({ role: usersTable.role })
      .from(usersTable)
      .where(eq(usersTable.id, req.session.userId!));
    if (!caller || caller.role !== "admin") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }

    const { permissions } = req.body as { permissions?: string[] };
    if (!Array.isArray(permissions)) {
      res.status(400).json({ error: "permissions must be an array" });
      return;
    }

    const [employee] = await db
      .update(usersTable)
      .set({ permissions } as any)
      .where(and(eq(usersTable.id, id), eq(usersTable.role, "staff")))
      .returning();

    if (!employee) {
      res.status(404).json({ error: "Employee not found" });
      return;
    }

    res.json(serializeUser(employee));
  },
);

router.delete(
  "/admin/employees/:id",
  requireAdmin,
  requirePermission("employees.delete"),
  async (req, res): Promise<void> => {
    const params = DeleteEmployeeParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    if (params.data.id === res.locals.currentUser?.id) {
      res.status(400).json({ error: "لا يمكنك حذف حسابك الخاص" });
      return;
    }

    const [existing] = await db
      .select()
      .from(usersTable)
      .where(and(eq(usersTable.id, params.data.id), eq(usersTable.role, "staff")));
    if (!existing) {
      res.status(404).json({ error: "Employee not found" });
      return;
    }

    await db.delete(usersTable).where(eq(usersTable.id, params.data.id));
    res.status(204).send();
  },
);

function generateReferenceNumber(prefix: string): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${stamp}${rand}`;
}

router.get("/admin/payments", requireAdmin, requirePermission("payments.view"), async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(paymentsTable)
    .orderBy(desc(paymentsTable.createdAt));

  res.json(ListPaymentsResponse.parse(rows));
});

router.post("/admin/payments", requireAdmin, requirePermission("payments.create"), async (req, res): Promise<void> => {
  const parsed = CreatePaymentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { paidAt, ...rest } = parsed.data;
  const [payment] = await db
    .insert(paymentsTable)
    .values({
      ...rest,
      paidAt: paidAt ? new Date(paidAt) : undefined,
      referenceNumber: generateReferenceNumber("PAY"),
    } as any)
    .returning();

  res.status(201).json(CreatePaymentResponse.parse(payment));
});

router.patch(
  "/admin/payments/:id",
  requireAdmin,
  requirePermission("payments.edit_prices"),
  async (req, res): Promise<void> => {
    const params = UpdatePaymentParams.safeParse(req.params);
    const parsed = UpdatePaymentBody.safeParse(req.body);
    if (!params.success || !parsed.success) {
      res
        .status(400)
        .json({ error: (params.error ?? parsed.error)!.message });
      return;
    }

    const [existing] = await db
      .select()
      .from(paymentsTable)
      .where(eq(paymentsTable.id, params.data.id));
    if (!existing) {
      res.status(404).json({ error: "Payment not found" });
      return;
    }

    const { paidAt, ...rest } = parsed.data;
    const updates = { ...rest } as Partial<typeof paymentsTable.$inferInsert>;
    if (paidAt !== undefined) {
      updates.paidAt = paidAt ? new Date(paidAt) : null;
    }

    const [payment] = await db
      .update(paymentsTable)
      .set(updates)
      .where(eq(paymentsTable.id, params.data.id))
      .returning();

    res.json(UpdatePaymentResponse.parse(payment));
  },
);

router.delete(
  "/admin/payments/:id",
  requireAdmin,
  requirePermission("payments.delete"),
  async (req, res): Promise<void> => {
    const params = DeletePaymentParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const [existing] = await db
      .select()
      .from(paymentsTable)
      .where(eq(paymentsTable.id, params.data.id));
    if (!existing) {
      res.status(404).json({ error: "Payment not found" });
      return;
    }

    await db.delete(paymentsTable).where(eq(paymentsTable.id, params.data.id));
    res.status(204).send();
  },
);

router.get("/admin/invoices", requireAdmin, requirePermission("payments.view"), async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(invoicesTable)
    .orderBy(desc(invoicesTable.createdAt));

  res.json(ListInvoicesResponse.parse(rows));
});

router.post("/admin/invoices", requireAdmin, requirePermission("payments.create"), async (req, res): Promise<void> => {
  const parsed = CreateInvoiceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { issuedAt, ...rest } = parsed.data;
  const [invoice] = await db
    .insert(invoicesTable)
    .values({
      ...rest,
      issuedAt: issuedAt ? new Date(issuedAt) : undefined,
      invoiceNumber: generateReferenceNumber("INV"),
    } as any)
    .returning();

  res.status(201).json(CreateInvoiceResponse.parse(invoice));
});

router.patch(
  "/admin/invoices/:id",
  requireAdmin,
  requirePermission("payments.edit_prices"),
  async (req, res): Promise<void> => {
    const params = UpdateInvoiceParams.safeParse(req.params);
    const parsed = UpdateInvoiceBody.safeParse(req.body);
    if (!params.success || !parsed.success) {
      res
        .status(400)
        .json({ error: (params.error ?? parsed.error)!.message });
      return;
    }

    const [existing] = await db
      .select()
      .from(invoicesTable)
      .where(eq(invoicesTable.id, params.data.id));
    if (!existing) {
      res.status(404).json({ error: "Invoice not found" });
      return;
    }

    const { issuedAt, ...rest } = parsed.data;
    const updates = { ...rest } as Partial<typeof invoicesTable.$inferInsert>;
    if (issuedAt !== undefined) {
      updates.issuedAt = issuedAt ? new Date(issuedAt) : null;
    }

    const [invoice] = await db
      .update(invoicesTable)
      .set(updates)
      .where(eq(invoicesTable.id, params.data.id))
      .returning();

    res.json(UpdateInvoiceResponse.parse(invoice));
  },
);

router.delete(
  "/admin/invoices/:id",
  requireAdmin,
  requirePermission("payments.delete"),
  async (req, res): Promise<void> => {
    const params = DeleteInvoiceParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const [existing] = await db
      .select()
      .from(invoicesTable)
      .where(eq(invoicesTable.id, params.data.id));
    if (!existing) {
      res.status(404).json({ error: "Invoice not found" });
      return;
    }

    await db.delete(invoicesTable).where(eq(invoicesTable.id, params.data.id));
    res.status(204).send();
  },
);

export default router;
