/**
 * Background job: auto-expire held bookings whose holdExpiresAt has passed.
 * Runs every 60 seconds.
 */
import { lt, eq } from "drizzle-orm";
import { db, flightBookingsTable } from "@workspace/db";
import { sendHoldExpiredEmail } from "./email";
import { logger } from "./logger";

let jobHandle: ReturnType<typeof setInterval> | null = null;

async function expireHeldBookings(): Promise<void> {
  try {
    const now = new Date();

    // Find all held bookings past their expiry
    const expired = await db
      .select()
      .from(flightBookingsTable)
      .where(
        // Drizzle doesn't have a simple AND with nullability check in one call —
        // filter in JS after fetching status=held rows
        eq(flightBookingsTable.status, "held"),
      );

    const toExpire = expired.filter(
      (b) => b.holdExpiresAt && new Date(b.holdExpiresAt) < now,
    );

    if (toExpire.length === 0) return;

    logger.info({ count: toExpire.length }, "[HoldExpiry] Expiring held bookings");

    for (const booking of toExpire) {
      // Update status
      await db
        .update(flightBookingsTable)
        .set({ status: "expired_hold" })
        .where(eq(flightBookingsTable.id, booking.id));

      // Send expiry email
      const pax = booking.passengers[0];
      const passengerName = pax ? `${pax.firstName} ${pax.lastName}` : "العميل";

      await sendHoldExpiredEmail({
        to: booking.email,
        referenceNumber: booking.referenceNumber,
        fromAirport: booking.offer.fromAirport,
        toAirport: booking.offer.toAirport,
        airlineName: booking.offer.airlineName,
        passengerName,
      });

      logger.info(
        { bookingId: booking.id, ref: booking.referenceNumber },
        "[HoldExpiry] Booking expired and email sent",
      );
    }
  } catch (err: any) {
    logger.error({ err: err?.message }, "[HoldExpiry] Error running expiry job");
  }
}

/** Start the background hold-expiry job. Safe to call multiple times. */
export function startHoldExpiryJob(): void {
  if (jobHandle) return;
  // Run immediately on start, then every 60 seconds
  expireHeldBookings();
  jobHandle = setInterval(expireHeldBookings, 60_000);
  logger.info("[HoldExpiry] Background job started (60s interval)");
}

export function stopHoldExpiryJob(): void {
  if (jobHandle) {
    clearInterval(jobHandle);
    jobHandle = null;
  }
}
