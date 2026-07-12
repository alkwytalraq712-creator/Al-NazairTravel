import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, flightBookingsTable, holdSettingsTable } from "@workspace/db";
import { sendHoldConfirmationEmail } from "../lib/email";
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
import { requireAdmin, requireAuth, requirePermission } from "../lib/auth";
import { generateReferenceNumber } from "../lib/reference";
import {
  createFlightOrder,
  duffelPost,
  isDuffelConfigured,
  parseDuration,
  type CreatedOrder,
} from "../lib/duffel";

const router: IRouter = Router();

/** Map a Duffel offer → our FlightOffer shape (outbound slice only) */
function mapOffer(offer: any, cabinClass: string): object {
  const slice = offer.slices?.[0];
  if (!slice) throw new Error("Duffel offer has no slices");

  const segments: any[] = slice.segments ?? [];
  const firstSeg = segments[0];
  const lastSeg = segments[segments.length - 1];

  const carrier = firstSeg?.marketing_carrier ?? firstSeg?.operating_carrier ?? {};
  const iataCode = carrier.iata_code ?? "";
  const flightNum = firstSeg?.marketing_carrier_flight_number ?? "";
  const airlineName = carrier.name ?? "Unknown Airline";
  const airlineLogoUrl =
    carrier.logo_lockup_url ??
    carrier.logo_symbol_url ??
    `https://logo.clearbit.com/${airlineName.toLowerCase().replace(/\s+/g, "")}.com`;

  const departTime = firstSeg?.departing_at ?? slice.departure_datetime ?? "";
  const arriveTime = lastSeg?.arriving_at ?? slice.arrival_datetime ?? "";
  const durationMinutes = parseDuration(slice.duration);
  const stops = Math.max(0, segments.length - 1);

  return {
    id: offer.id,
    airlineName,
    airlineLogoUrl,
    flightNumber: iataCode && flightNum ? `${iataCode}${flightNum}` : flightNum || offer.id.slice(-6),
    fromAirport: firstSeg?.origin?.iata_code ?? slice.origin?.iata_code ?? "",
    toAirport: lastSeg?.destination?.iata_code ?? slice.destination?.iata_code ?? "",
    departTime: departTime ? new Date(departTime).toISOString() : new Date().toISOString(),
    arriveTime: arriveTime ? new Date(arriveTime).toISOString() : new Date().toISOString(),
    durationMinutes,
    stops,
    cabinClass,
    price: parseFloat(offer.total_amount ?? "0"),
    currency: offer.total_currency ?? "USD",
  };
}

// ─── Mock fallback (used when Duffel key not configured or route has error) ────

const MOCK_AIRLINES = [
  { name: "Iraqi Airways",    logo: "https://logo.clearbit.com/iraqiairways.com" },
  { name: "Turkish Airlines", logo: "https://logo.clearbit.com/turkishairlines.com" },
  { name: "Qatar Airways",    logo: "https://logo.clearbit.com/qatarairways.com" },
  { name: "Emirates",         logo: "https://logo.clearbit.com/emirates.com" },
];

function mockOffers(from: string, to: string, departDate: string | Date, cabinClass: string) {
  const dateStr = typeof departDate === "string" ? departDate : toDateStr(departDate);
  const base = new Date(`${dateStr}T00:00:00.000Z`);
  return MOCK_AIRLINES.map((airline, i) => {
    const dur = 90 + i * 35;
    const dep = new Date(base);
    dep.setUTCHours(6 + i * 4, 0, 0, 0);
    const arr = new Date(dep.getTime() + dur * 60000);
    return {
      id: `mock-${departDate}-${from}-${to}-${i}`,
      airlineName: airline.name,
      airlineLogoUrl: airline.logo,
      flightNumber: `${airline.name.slice(0, 2).toUpperCase()}${100 + i * 7}`,
      fromAirport: from,
      toAirport: to,
      departTime: dep.toISOString(),
      arriveTime: arr.toISOString(),
      durationMinutes: dur,
      stops: i % 2,
      cabinClass,
      price: 180 + i * 65,
      currency: "USD",
    };
  });
}

// ─── Flight search route ───────────────────────────────────────────────────────

/** Convert a YYYY-MM-DD string to a Date for zod.date() consumption */
function coerceDateQuery(raw: Record<string, any>) {
  const out = { ...raw };
  for (const key of ["departDate", "returnDate"] as const) {
    if (typeof out[key] === "string" && out[key]) {
      out[key] = new Date(out[key]);
    }
  }
  return out;
}

/** Format a Date back to YYYY-MM-DD (Duffel expects this) */
function toDateStr(d: Date | string): string {
  if (typeof d === "string") return d.slice(0, 10);
  return d.toISOString().slice(0, 10);
}

router.get("/flights/search", async (req, res): Promise<void> => {
  const query = SearchFlightsQueryParams.safeParse(coerceDateQuery(req.query as any));
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const {
    from, to, departDate, returnDate, tripType,
    adults = 1, children = 0, infants = 0,
    cabinClass = "economy",
  } = query.data;

  // ── If no Duffel key, return mock data ──
  if (!isDuffelConfigured()) {
    const offers = mockOffers(from, to, departDate, cabinClass);
    res.json(SearchFlightsResponse.parse(offers));
    return;
  }

  try {
    // Build slices (departDate / returnDate are Date objects from zod; format back to YYYY-MM-DD)
    const slices: any[] = [{ origin: from, destination: to, departure_date: toDateStr(departDate) }];
    if ((tripType === "round_trip" || returnDate) && returnDate) {
      slices.push({ origin: to, destination: from, departure_date: toDateStr(returnDate) });
    }

    // Build passengers
    const passengers: { type: string }[] = [
      ...Array(Math.max(1, adults)).fill({ type: "adult" }),
      ...Array(Math.max(0, children)).fill({ type: "child" }),
      // Duffel requires infants ≤ adults; cap silently
      ...Array(Math.min(Math.max(0, infants), Math.max(1, adults))).fill({ type: "infant_without_seat" }),
    ];

    const offerRequest = await duffelPost("/air/offer_requests", {
      slices,
      passengers,
      cabin_class: cabinClass,
      return_offers: true,
    });

    const rawOffers: any[] = offerRequest.offers ?? [];

    // Map each offer to our schema; skip any that fail mapping
    const mapped: object[] = [];
    for (const offer of rawOffers) {
      try {
        mapped.push(mapOffer(offer, cabinClass));
      } catch {
        // skip malformed offers
      }
    }

    // If Duffel returned nothing, fall back to mock
    if (mapped.length === 0) {
      const offers = mockOffers(from, to, departDate, cabinClass);
      res.json(SearchFlightsResponse.parse(offers));
      return;
    }

    res.json(SearchFlightsResponse.parse(mapped));
  } catch (err: any) {
    // Log the error and fall back to mock results rather than failing the user
    console.error("[Duffel] search error:", err?.message ?? err);
    const offers = mockOffers(from, to, departDate, cabinClass);
    res.json(SearchFlightsResponse.parse(offers));
  }
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

    const { offer, passengers, phone, email } = parsed.data;

    // Normalize passenger dates to YYYY-MM-DD strings.
    const normPassengers = passengers.map((p) => ({
      ...p,
      dob: p.dob instanceof Date ? p.dob.toISOString().slice(0, 10) : p.dob,
      passportExpiry:
        p.passportExpiry instanceof Date
          ? p.passportExpiry.toISOString().slice(0, 10)
          : p.passportExpiry,
    }));

    const offerSnapshot = {
      ...offer,
      departTime: offer.departTime.toISOString(),
      arriveTime: offer.arriveTime.toISOString(),
    };

    // Only real Duffel offers (off_...) can become real orders. Mock offers
    // (returned when Duffel is unavailable) are stored locally as "pending".
    const isRealOffer =
      typeof offer.id === "string" && offer.id.startsWith("off_");
    let order: CreatedOrder | null = null;

    if (isRealOffer && isDuffelConfigured()) {
      try {
        order = await createFlightOrder({
          offerId: offer.id,
          email,
          phone,
          passengers: normPassengers.map((p) => ({
            firstName: p.firstName,
            lastName: p.lastName,
            gender: p.gender,
            dob: p.dob,
            passportNumber: p.passportNumber,
            passportExpiry: p.passportExpiry,
            passportIssueCountry: p.passportIssueCountry,
            nationality: p.nationality,
          })),
        });
      } catch (err: any) {
        console.error("[Duffel] order error:", err?.message ?? err);
        const expired =
          err?.status === 404 ||
          /expire|no longer|not found|not available|unavailable|sold out/i.test(
            String(err?.message ?? ""),
          );
        if (expired) {
          // Offer no longer exists → tell the user to search again
          res.status(409).json({
            error: "انتهت صلاحية عرض هذه الرحلة أو لم يعد متاحًا. يرجى إعادة البحث واختيار الرحلة من جديد.",
          });
          return;
        }
        // Any other Duffel error (airline internal error, balance issue, etc.)
        // → fall back to a local "pending" booking so the user still gets a
        //   success screen. Ops team can see it in the admin dashboard and
        //   handle it manually.
        console.warn("[Duffel] Non-expiry error — storing local pending booking:", err?.message);
        // order stays null → booking is saved with status "pending" below
      }
    }

    const passengersToStore = normPassengers.map((p, i) => ({
      ...p,
      eTicketNumber: order?.perPassengerETickets?.[i] ?? undefined,
    }));

    const [booking] = await db
      .insert(flightBookingsTable)
      .values({
        offer: offerSnapshot,
        passengers: passengersToStore,
        phone,
        email,
        userId: req.session.userId as number,
        referenceNumber: generateReferenceNumber("FLT"),
        provider: order ? "duffel" : "local",
        providerMode: order?.providerMode ?? null,
        bookingReference: order?.bookingReference ?? null,
        duffelOrderId: order?.duffelOrderId ?? null,
        eticketNumbers: order?.eTicketNumbers ?? null,
        segments: order?.segments ?? null,
        baggage: order?.baggage ?? null,
        status: order?.status ?? "pending",
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

// ─── Hold Booking ─────────────────────────────────────────────────────────────

router.post(
  "/flight-bookings/hold",
  requireAuth,
  async (req, res): Promise<void> => {
    // 1. Check hold settings
    const [settings] = await db
      .select()
      .from(holdSettingsTable)
      .where(eq(holdSettingsTable.id, 1));

    const holdEnabled = settings?.holdEnabled ?? true;
    if (!holdEnabled) {
      res.status(403).json({ error: "خدمة الحجز المؤقت غير متاحة حالياً" });
      return;
    }

    // 2. Parse body — same shape as a regular booking
    const parsed = CreateFlightBookingBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const { offer, passengers, phone, email } = parsed.data;

    const normPassengers = passengers.map((p) => ({
      ...p,
      dob: p.dob instanceof Date ? p.dob.toISOString().slice(0, 10) : p.dob,
      passportExpiry:
        p.passportExpiry instanceof Date
          ? p.passportExpiry.toISOString().slice(0, 10)
          : p.passportExpiry,
    }));

    const offerSnapshot = {
      ...offer,
      departTime: offer.departTime.toISOString(),
      arriveTime: offer.arriveTime.toISOString(),
    };

    const holdDurationHours = settings?.holdDurationHours ?? 24;
    const holdFeeAmount = settings?.holdFeeAmount ?? 25;
    const holdExpiresAt = new Date(Date.now() + holdDurationHours * 60 * 60 * 1000);

    const [booking] = await db
      .insert(flightBookingsTable)
      .values({
        offer: offerSnapshot,
        passengers: normPassengers,
        phone,
        email,
        userId: req.session.userId as number,
        referenceNumber: generateReferenceNumber("HLD"),
        provider: "local",
        status: "held",
        holdExpiresAt,
        holdFeeAmount,
      })
      .returning();

    // 3. Send confirmation email (non-blocking)
    const pax = normPassengers[0];
    if (pax) {
      sendHoldConfirmationEmail({
        to: email,
        referenceNumber: booking.referenceNumber,
        fromAirport: offerSnapshot.fromAirport,
        toAirport: offerSnapshot.toAirport,
        airlineName: offerSnapshot.airlineName,
        departTime: offerSnapshot.departTime,
        holdExpiresAt: holdExpiresAt.toISOString(),
        holdFeeAmount,
        currency: offerSnapshot.currency,
        passengerName: `${pax.firstName} ${pax.lastName}`,
      }).catch(() => {});
    }

    res.status(201).json(booking);
  },
);

router.post(
  "/flight-bookings/:id/complete",
  requireAuth,
  async (req, res): Promise<void> => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid booking id" });
      return;
    }

    const [booking] = await db
      .select()
      .from(flightBookingsTable)
      .where(eq(flightBookingsTable.id, id));

    if (!booking) {
      res.status(404).json({ error: "Booking not found" });
      return;
    }
    if (booking.userId !== req.session.userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    if (booking.status !== "held") {
      res.status(409).json({ error: "هذا الحجز غير موجود في حالة الحجز المؤقت" });
      return;
    }
    if (booking.holdExpiresAt && new Date(booking.holdExpiresAt) < new Date()) {
      // Mark as expired
      await db
        .update(flightBookingsTable)
        .set({ status: "expired_hold" })
        .where(eq(flightBookingsTable.id, id));
      res.status(410).json({ error: "انتهت مدة الحجز المؤقت. يرجى إنشاء حجز جديد." });
      return;
    }

    // Transition to "pending" — admin will confirm and issue ticket
    const [updated] = await db
      .update(flightBookingsTable)
      .set({ status: "pending" })
      .where(eq(flightBookingsTable.id, id))
      .returning();

    res.json(updated);
  },
);

router.get(
  "/admin/flight-bookings",
  requireAdmin,
  requirePermission("flight_bookings.view"),
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
  requirePermission("flight_bookings.edit"),
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
