// Duffel API client.
//
// Test vs. live is selected purely by the value of DUFFEL_API_KEY:
//   - test keys are prefixed `duffel_test_`
//   - live keys are prefixed `duffel_live_`
// Switching environments is therefore a key change only — no code changes are
// required to move from Test Mode to Live Mode. An optional DUFFEL_MODE env var
// can force the reported mode for logging/labelling.

const DUFFEL_BASE = "https://api.duffel.com";
const DUFFEL_VERSION = "v2";

export type DuffelMode = "test" | "live" | "unknown";

export function getDuffelKey(): string | undefined {
  return process.env.DUFFEL_API_KEY || undefined;
}

export function isDuffelConfigured(): boolean {
  return !!getDuffelKey();
}

export function getDuffelMode(): DuffelMode {
  const explicit = process.env.DUFFEL_MODE?.toLowerCase();
  if (explicit === "test" || explicit === "live") return explicit;
  const key = getDuffelKey() ?? "";
  if (key.startsWith("duffel_test_")) return "test";
  if (key.startsWith("duffel_live_")) return "live";
  return "unknown";
}

export interface DuffelError extends Error {
  duffelCode?: string;
  status?: number;
}

async function duffelFetch(path: string, init: RequestInit): Promise<any> {
  const key = getDuffelKey();
  if (!key) throw new Error("DUFFEL_API_KEY is not set");

  const res = await fetch(`${DUFFEL_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${key}`,
      "Duffel-Version": DUFFEL_VERSION,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init.headers ?? {}),
    },
  });

  const text = await res.text();
  const json = text ? JSON.parse(text) : {};
  if (!res.ok) {
    const first = json?.errors?.[0];
    const msg =
      first?.message ?? first?.title ?? json?.meta?.status ?? `Duffel error ${res.status}`;
    const err = new Error(msg) as DuffelError;
    err.duffelCode = first?.code;
    err.status = res.status;
    throw err;
  }
  return json.data;
}

export function duffelPost(path: string, body: unknown): Promise<any> {
  return duffelFetch(path, { method: "POST", body: JSON.stringify({ data: body }) });
}

export function duffelGet(path: string): Promise<any> {
  return duffelFetch(path, { method: "GET" });
}

/** Fetch a single offer (used to re-validate + read passenger ids before ordering). */
export function getOffer(offerId: string): Promise<any> {
  return duffelGet(
    `/air/offers/${encodeURIComponent(offerId)}?return_available_services=false`,
  );
}

/** Parse ISO 8601 duration (PT2H30M, PT45M, PT1H) → minutes */
export function parseDuration(dur: string | null | undefined): number {
  if (!dur) return 0;
  const m = dur.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!m) return 0;
  return parseInt(m[1] ?? "0") * 60 + parseInt(m[2] ?? "0");
}

// ─── Passenger data mappers ─────────────────────────────────────────────────

/** Coerce a phone number to E.164 (Duffel requires this). Defaults to Iraq (+964). */
export function toE164(phone: string, defaultCc = "964"): string {
  const raw = (phone ?? "").trim();
  if (!raw) return "";
  if (raw.startsWith("+")) return "+" + raw.slice(1).replace(/\D/g, "");
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("00")) return "+" + digits.slice(2);
  if (digits.startsWith("0")) digits = digits.slice(1);
  if (digits.startsWith(defaultCc)) return "+" + digits;
  return "+" + defaultCc + digits;
}

export function toDuffelGender(gender: string | undefined): "m" | "f" {
  const g = (gender ?? "").trim().toLowerCase();
  if (g.startsWith("f") || g === "female" || g === "أنثى" || g === "انثى") return "f";
  return "m";
}

export function toDuffelTitle(gender: string | undefined): "mr" | "ms" {
  return toDuffelGender(gender) === "f" ? "ms" : "mr";
}

const COUNTRY_ISO2: Record<string, string> = {
  IRAQ: "IQ", IRQ: "IQ",
  SAUDI: "SA", "SAUDI ARABIA": "SA", SAU: "SA", KSA: "SA",
  KUWAIT: "KW", KWT: "KW",
  QATAR: "QA", QAT: "QA",
  BAHRAIN: "BH", BHR: "BH",
  OMAN: "OM", OMN: "OM",
  "UNITED ARAB EMIRATES": "AE", UAE: "AE", ARE: "AE", EMIRATES: "AE",
  JORDAN: "JO", JOR: "JO",
  EGYPT: "EG", EGY: "EG",
  SYRIA: "SY", SYR: "SY",
  LEBANON: "LB", LBN: "LB",
  YEMEN: "YE", YEM: "YE",
  TURKEY: "TR", TUR: "TR", "TÜRKIYE": "TR", TURKIYE: "TR",
  IRAN: "IR", IRN: "IR",
  "UNITED STATES": "US", USA: "US",
  "UNITED KINGDOM": "GB", UK: "GB", GBR: "GB",
  GERMANY: "DE", DEU: "DE",
  FRANCE: "FR", FRA: "FR",
  INDIA: "IN", IND: "IN",
  PAKISTAN: "PK", PAK: "PK",
};

/** Best-effort ISO 3166-1 alpha-2 code from a country name/code. */
export function toIso2Country(input: string | undefined): string | undefined {
  const raw = (input ?? "").trim();
  if (!raw) return undefined;
  const upper = raw.toUpperCase();
  if (/^[A-Z]{2}$/.test(upper)) return upper;
  if (COUNTRY_ISO2[upper]) return COUNTRY_ISO2[upper];
  const firstWord = upper.split(/[\s,]+/)[0];
  if (firstWord && COUNTRY_ISO2[firstWord]) return COUNTRY_ISO2[firstWord];
  return undefined;
}

// ─── Order creation ─────────────────────────────────────────────────────────

export interface OrderPassengerInput {
  firstName: string;
  lastName: string;
  gender?: string;
  dob: string; // YYYY-MM-DD
  passportNumber?: string;
  passportExpiry?: string; // YYYY-MM-DD
  passportIssueCountry?: string;
  nationality?: string;
}

export interface NormalizedSegment {
  fromAirport: string;
  fromAirportName?: string;
  fromCity?: string;
  toAirport: string;
  toAirportName?: string;
  toCity?: string;
  departTime: string;
  arriveTime: string;
  airlineName?: string;
  airlineLogoUrl?: string;
  flightNumber?: string;
  aircraft?: string;
  durationMinutes?: number;
  cabinClass?: string;
}

export interface CreatedOrder {
  duffelOrderId: string;
  bookingReference: string | null;
  providerMode: DuffelMode;
  eTicketNumbers: string[];
  perPassengerETickets: (string | undefined)[];
  segments: NormalizedSegment[];
  baggage: string | null;
  status: string; // "ticketed" | "confirmed"
}

/**
 * Create a real Duffel order for an offer. In Test Mode this issues a genuine
 * test PNR/e-ticket with no financial charge; in Live Mode it books for real.
 * The offer is re-fetched first to validate availability and read passenger ids.
 */
export async function createFlightOrder(params: {
  offerId: string;
  passengers: OrderPassengerInput[];
  email: string;
  phone: string;
}): Promise<CreatedOrder> {
  const offer = await getOffer(params.offerId);
  const offerPassengers: any[] = offer.passengers ?? [];
  if (offerPassengers.length !== params.passengers.length) {
    throw new Error(
      `Passenger count mismatch: offer expects ${offerPassengers.length}, received ${params.passengers.length}`,
    );
  }

  const idDocsRequired = !!offer.passenger_identity_documents_required;
  const phone = toE164(params.phone);

  const orderPassengers = params.passengers.map((p, i) => {
    const op = offerPassengers[i];
    const passenger: any = {
      id: op.id,
      title: toDuffelTitle(p.gender),
      given_name: p.firstName,
      family_name: p.lastName,
      born_on: p.dob,
      gender: toDuffelGender(p.gender),
      email: params.email,
      phone_number: phone,
    };
    const iso2 = toIso2Country(p.passportIssueCountry) ?? toIso2Country(p.nationality);
    if (p.passportNumber && p.passportExpiry && (iso2 || idDocsRequired)) {
      passenger.identity_documents = [
        {
          type: "passport",
          unique_identifier: p.passportNumber,
          issuing_country_code: iso2 ?? "IQ",
          expires_on: p.passportExpiry,
        },
      ];
    }
    return passenger;
  });

  const order = await duffelPost("/air/orders", {
    type: "instant",
    selected_offers: [params.offerId],
    payments: [
      { type: "balance", currency: offer.total_currency, amount: offer.total_amount },
    ],
    passengers: orderPassengers,
  });

  const docs: any[] = Array.isArray(order.documents) ? order.documents : [];
  const eTicketNumbers = docs
    .filter((d) => String(d?.type ?? "").includes("ticket") && d?.unique_identifier)
    .map((d) => String(d.unique_identifier));

  const segments: NormalizedSegment[] = [];
  for (const slice of (order.slices ?? []) as any[]) {
    for (const seg of (slice.segments ?? []) as any[]) {
      const carrier = seg.marketing_carrier ?? seg.operating_carrier ?? {};
      const segPax = seg.passengers?.[0] ?? {};
      segments.push({
        fromAirport: seg.origin?.iata_code ?? "",
        fromAirportName: seg.origin?.name,
        fromCity: seg.origin?.city_name ?? seg.origin?.city?.name,
        toAirport: seg.destination?.iata_code ?? "",
        toAirportName: seg.destination?.name,
        toCity: seg.destination?.city_name ?? seg.destination?.city?.name,
        departTime: seg.departing_at,
        arriveTime: seg.arriving_at,
        airlineName: carrier.name,
        airlineLogoUrl: carrier.logo_symbol_url ?? carrier.logo_lockup_url,
        flightNumber:
          carrier.iata_code && seg.marketing_carrier_flight_number
            ? `${carrier.iata_code}${seg.marketing_carrier_flight_number}`
            : seg.marketing_carrier_flight_number,
        aircraft: seg.aircraft?.name,
        durationMinutes: parseDuration(seg.duration),
        cabinClass: segPax.cabin_class_marketing_name ?? segPax.cabin_class,
      });
    }
  }

  let baggage: string | null = null;
  const firstBags = (order.slices?.[0]?.segments?.[0]?.passengers?.[0]?.baggages ?? []) as any[];
  if (firstBags.length) {
    const checked = firstBags.find((b) => b.type === "checked");
    const carry = firstBags.find((b) => b.type === "carry_on");
    const parts: string[] = [];
    if (checked) parts.push(`${checked.quantity} حقيبة مسجّلة`);
    if (carry) parts.push(`${carry.quantity} حقيبة يد`);
    baggage = parts.join(" • ") || null;
  }

  const perPassengerETickets =
    eTicketNumbers.length === params.passengers.length
      ? eTicketNumbers
      : params.passengers.map(() => undefined);

  return {
    duffelOrderId: order.id,
    bookingReference: order.booking_reference ?? null,
    providerMode: getDuffelMode(),
    eTicketNumbers,
    perPassengerETickets,
    segments,
    baggage,
    status: eTicketNumbers.length ? "ticketed" : "confirmed",
  };
}
