/**
 * flightService.ts — single service module for all flight operations.
 *
 * ALL screens import from here, not from the generated hooks directly.
 * A future GDS swap (Amadeus/Sabre) only touches this file.
 */
import {
  useSearchFlights,
  useCreateFlightBooking,
  getSearchFlightsQueryKey,
} from '@workspace/api-client-react';
import type {
  FlightOffer,
  CabinClass,
  FlightBookingInput,
} from '@workspace/api-client-react';

// ─── Re-export types for consumers ─────────────────────────────────────────────
export type { FlightOffer, CabinClass, FlightBookingInput };

// ─── Search params ──────────────────────────────────────────────────────────────
export interface FlightSearchParams {
  from: string;
  to: string;
  departDate: string;
  returnDate?: string;
  adults: number;
  children?: number;
  infants?: number;
  cabinClass: CabinClass;
}

// ─── Passenger model (mirrors API Passenger) ────────────────────────────────────
export interface PassengerInput {
  firstName: string;
  lastName: string;
  nationality: string;
  gender: string;
  dob: string;
  passportNumber: string;
  passportExpiry: string;
  passportIssueCountry?: string;
}

// ─── Seat selection (client-side only, not persisted to API) ───────────────────
export interface SeatSelection {
  passengerId: number; // index
  seat: string; // e.g. "12A"
  row: number;
  col: string;
}

// ─── Hooks (thin wrappers so screens never import api-client-react directly) ────

export function useFlightSearch(params: FlightSearchParams, enabled: boolean) {
  return useSearchFlights(params, {
    query: {
      queryKey: getSearchFlightsQueryKey(params),
      enabled,
    } as any,
  });
}

export function useFlightBooking() {
  return useCreateFlightBooking();
}

// ─── Seat map generation ─────────────────────────────────────────────────────────
export type SeatStatus = 'available' | 'occupied' | 'premium' | 'selected';

export interface SeatMapSeat {
  id: string;   // e.g. "12A"
  row: number;
  col: string;
  status: SeatStatus;
}

export interface SeatMapRow {
  row: number;
  seats: SeatMapSeat[];
  isExit?: boolean;
}

/**
 * Deterministic seeded pseudo-random (mulberry32) — same seed → same map.
 */
function seededRand(seed: number) {
  return function () {
    seed = (seed ^ (seed << 13)) >>> 0;
    seed = (seed ^ (seed >> 17)) >>> 0;
    seed = (seed ^ (seed << 5)) >>> 0;
    return seed / 0xffffffff;
  };
}

function strHash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function generateSeatMap(
  offerId: string,
  cabinClass: string,
): SeatMapRow[] {
  const rand = seededRand(strHash(offerId + cabinClass));

  let rows: number;
  let cols: string[];

  switch (cabinClass) {
    case 'first':
      rows = 4;
      cols = ['A', 'C', 'D', 'F'];   // 1-2-1 pattern (aisle between C-D)
      break;
    case 'business':
      rows = 8;
      cols = ['A', 'C', 'D', 'F'];   // 2-2
      break;
    case 'premium_economy':
      rows = 10;
      cols = ['A', 'B', 'C', 'D', 'E', 'F']; // 3-3
      break;
    default: // economy
      rows = 30;
      cols = ['A', 'B', 'C', 'D', 'E', 'F']; // 3-3
  }

  const exitRows = new Set<number>([
    Math.floor(rows / 3),
    Math.floor((rows * 2) / 3),
  ]);

  const result: SeatMapRow[] = [];

  for (let r = 1; r <= rows; r++) {
    const seats: SeatMapSeat[] = cols.map(col => {
      const id = `${r}${col}`;
      const rng = rand();
      let status: SeatStatus = 'available';
      if (rng < 0.35) status = 'occupied';
      else if (rng < 0.50 && (col === 'A' || col === 'F')) status = 'premium';
      return { id, row: r, col, status };
    });

    result.push({ row: r, seats, isExit: exitRows.has(r) });
  }

  return result;
}

// ─── Format helpers (shared across screens) ──────────────────────────────────────
export function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit', hour12: false });
  } catch {
    return iso;
  }
}

export function formatDuration(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}س ${m}د`;
}

export function formatDateAr(iso: string): string {
  if (!iso) return '';
  try {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return iso;
  }
}

export const CABIN_LABELS_AR: Record<string, string> = {
  economy: 'الدرجة الاقتصادية',
  premium_economy: 'الاقتصادية المميزة',
  business: 'رجال الأعمال',
  first: 'الدرجة الأولى',
};
