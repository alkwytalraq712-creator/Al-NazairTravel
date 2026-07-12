---
name: Hold Booking Feature Architecture
description: Architecture and extension points for the hold booking feature added to Qema Travel.
---

## Summary
The Hold Booking feature lets customers reserve a flight for a fixed fee without paying in full. The hold expires automatically after a configurable duration (default 24 h).

## DB Changes
- `flight_bookings`: added `hold_expires_at timestamptz`, `hold_fee_amount double precision`
- `hold_settings` table (singleton id=1): `hold_enabled bool`, `hold_fee_amount float`, `hold_duration_hours int`

## New Statuses
- `held` — booking created, awaiting full payment
- `expired_hold` — background job set this when holdExpiresAt < now

## API Endpoints
- `GET /api/settings/hold` — public; returns HoldSettings
- `PATCH /api/admin/settings/hold` — admin-only
- `POST /api/flight-bookings/hold` — creates held booking (same body as regular booking)
- `POST /api/flight-bookings/:id/complete` — transitions `held` → `pending` for admin to process

## Background Job
`artifacts/api-server/src/lib/holdExpiry.ts` — `startHoldExpiryJob()` called from `app.ts`, runs setInterval every 60s.

## Email Service
`artifacts/api-server/src/lib/email.ts` — uses nodemailer if SMTP_HOST/SMTP_USER/SMTP_PASS env vars set, otherwise console.logs. Templates: hold confirmation + hold expired.

## API Client
`lib/api-client-react/src/generated/api-hold.ts` — manually authored (NOT orval-generated).
Exports: `useGetHoldSettings`, `useUpdateHoldSettings`, `useCreateHoldBooking`, `useCompleteHoldBooking`.
Re-exported from `lib/api-client-react/src/index.ts`.

**Why:** orval only regenerates from the OpenAPI YAML; new endpoints added directly in Express routes need matching hooks added manually to api-hold.ts.

**How to apply:** When adding more non-spec endpoints, add hooks to api-hold.ts following the same pattern, then rebuild: `tsc -b lib/api-client-react/tsconfig.json --force`.

## Mobile App
- `flight-review.tsx`: hold button + Modal, `useGetHoldSettings` + `useCreateHoldBooking`
- `my-flights.tsx`: HoldCountdown component for `held` status
- `e-ticket/[id].tsx`: HoldCountdownBanner + complete-payment button for held bookings

## Admin Dashboard
- `artifacts/admin-dashboard/src/pages/hold-settings.tsx` — settings form + held bookings table with live countdown
- Route `/hold-settings`, sidebar item "الحجوزات المؤقتة" with Clock icon
