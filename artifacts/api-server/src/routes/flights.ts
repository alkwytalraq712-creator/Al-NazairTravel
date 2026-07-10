import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, flightBookingsTable } from "@workspace/db";
import {
  SearchFlightsQueryParams,
  SearchFlightsResponse,
  ListMyFlightBookingsResponse,
  CreateFlightBookingBody,
  CreateFlightBookingResponse,
  GetFlightBookingParams,
  GetFlightBookingResponse,
  ListAllFlightBookingsQueryParams,
  ListAllFlightBookingsResponse,
  UpdateFlightBookingStatusParams,
  UpdateFlightBookingStatusBody,
  UpdateFlightBookingStatusResponse,
} from "@workspace/api-zod";
import { requireAdmin, requireAuth } from "../lib/auth";
import { generateReferenceNumber } from "../lib/reference";

const router: IRouter = Router();

const AIRLINES = [
  { name: "Iraqi Airways", logo: "https://logo.clearbit.com/iraqiairways.com" },
  { name: "Fly Baghdad", logo: "https://logo.clearbit.com/flybaghdad.aero" },
  { name: "Turkish Airlines", logo: "https://logo.clearbit.com/turkishairlines.com" },
  { name: "Qatar Airways", logo: "https://logo.clearbit.com/qatarairways.com" },
];

router.get("/flights/search", async (req, res): Promise<void> => {
  const query = SearchFlightsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { from, to, departDate, cabinClass } = query.data;
  const departBase = new Date(`${departDate}T00:00:00.000Z`);

  const offers = AIRLINES.map((airline, index) => {
    const departHour = 6 + index * 4;
    const durationMinutes = 90 + index * 35;
    const departTime = new Date(departBase);
    departTime.setUTCHours(departHour, 0, 0, 0);
    const arriveTime = new Date(departTime.getTime() + durationMinutes * 60000);

    return {
      id: `${departDate}-${from}-${to}-${index}`,
      airlineName: airline.name,
      airlineLogoUrl: airline.logo,
      flightNumber: `${airline.name.slice(0, 2).toUpperCase()}${100 + index * 7}`,
      fromAirport: from,
      toAirport: to,
      departTime: departTime.toISOString(),
      arriveTime: arriveTime.toISOString(),
      durationMinutes,
      stops: index % 2,
      cabinClass: cabinClass ?? "economy",
      price: 180 + index * 65,
      currency: "USD",
    };
  });

  res.json(SearchFlightsResponse.parse(offers));
});

router.get(
  "/flight-bookings",
  requireAuth,
  async (req, res): Promise<void> => {
    const rows = await db
      .select()
      .from(flightBookingsTable)
      .where(eq(flightBookingsTable.userId, req.session.userId as number))
      .orderBy(desc(flightBookingsTable.createdAt));

    res.json(ListMyFlightBookingsResponse.parse(rows));
  },
);

router.post(
  "/flight-bookings",
  requireAuth,
  async (req, res): Promise<void> => {
    const parsed = CreateFlightBookingBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const [booking] = await db
      .insert(flightBookingsTable)
      .values({
        offer: {
          ...parsed.data.offer,
          departTime: parsed.data.offer.departTime.toISOString(),
          arriveTime: parsed.data.offer.arriveTime.toISOString(),
        },
        passengers: parsed.data.passengers.map((p) => ({
          ...p,
          dob: p.dob instanceof Date ? p.dob.toISOString().slice(0, 10) : p.dob,
          passportExpiry:
            p.passportExpiry instanceof Date
              ? p.passportExpiry.toISOString().slice(0, 10)
              : p.passportExpiry,
        })),
        phone: parsed.data.phone,
        email: parsed.data.email,
        userId: req.session.userId as number,
        referenceNumber: generateReferenceNumber("FLT"),
      })
      .returning();

    res.status(201).json(CreateFlightBookingResponse.parse(booking));
  },
);

router.get(
  "/flight-bookings/:id",
  requireAuth,
  async (req, res): Promise<void> => {
    const params = GetFlightBookingParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const [booking] = await db
      .select()
      .from(flightBookingsTable)
      .where(eq(flightBookingsTable.id, params.data.id));

    if (!booking) {
      res.status(404).json({ error: "Flight booking not found" });
      return;
    }

    // Ownership check: only the booking owner can view it
    if (booking.userId !== req.session.userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    res.json(GetFlightBookingResponse.parse(booking));
  },
);

router.get(
  "/admin/flight-bookings",
  requireAdmin,
  async (req, res): Promise<void> => {
    const query = ListAllFlightBookingsQueryParams.safeParse(req.query);
    if (!query.success) {
      res.status(400).json({ error: query.error.message });
      return;
    }

    const rows = await db
      .select()
      .from(flightBookingsTable)
      .where(
        query.data.status
          ? eq(flightBookingsTable.status, query.data.status)
          : undefined,
      )
      .orderBy(desc(flightBookingsTable.createdAt));

    res.json(ListAllFlightBookingsResponse.parse(rows));
  },
);

router.patch(
  "/admin/flight-bookings/:id/status",
  requireAdmin,
  async (req, res): Promise<void> => {
    const params = UpdateFlightBookingStatusParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const parsed = UpdateFlightBookingStatusBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const [booking] = await db
      .update(flightBookingsTable)
      .set({ status: parsed.data.status })
      .where(eq(flightBookingsTable.id, params.data.id))
      .returning();

    if (!booking) {
      res.status(404).json({ error: "Flight booking not found" });
      return;
    }

    res.json(UpdateFlightBookingStatusResponse.parse(booking));
  },
);

export default router;
