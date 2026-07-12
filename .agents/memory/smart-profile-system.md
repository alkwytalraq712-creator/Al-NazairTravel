---
name: Smart Profile System
description: Architecture of the Smart Profile / auto-fill visa application system built in this project.
---

## What it is
Users fill in their profile once; the backend auto-fills all visa application fields from that profile. Visa applications now only require `{ visaId }` in the POST body — everything else is pulled server-side from the user's profile.

## Profile completion gate
- `GET /auth/profile/completion` → `{ percentage, isComplete, missingFields[] }` (auth required)
- Backend checks profile before allowing POST `/visa-applications`; returns 422 with `code: "PROFILE_INCOMPLETE"` if not 100% complete.
- `getProfileCompletion(user)` in `artifacts/api-server/src/lib/auth.ts` — 20 required base fields + 5 Gulf residence fields (conditional on `hasGulfResidence`).

## Eligibility system (admin-configurable, server-side)
- `GET /visas/:id/eligibility` → `{ eligible, blockers[] }` — computed server-side in `artifacts/api-server/src/routes/visas.ts`.
- Blockers include: blocked nationality, not in allowedNationalities, Gulf residence required (with optional specific country), no valid visa for required countries (schengen/uk/us/canada/australia/japan), missing invitation letter.
- Mobile `apply-visa/[id].tsx` calls `useGetVisaEligibility({ id })` and shows `EligibilityBlockWall` with all blockers + "استكمال المتطلبات" button (navigates to profile-edit) if not eligible.
- Old `GulfResidenceBlock` component replaced by `EligibilityBlockWall`.

## Terms & Conditions
- Navigation: visa card → `/apply-visa/terms/[id]` → `/apply-visa/[id]`.
- `POST /auth/accept-visa-terms` (requireAuth) inserts into `visa_application_consents` table. Consent is best-effort; mobile app navigates forward even if it fails.
- `visa_application_consents` table: id, user_id, visa_id, accepted_at. Drizzle schema in `lib/db/src/schema/visaConsents.ts`.

## DB schema additions (cumulative)
- **users table**: 26 original profile columns + 4 new: `active_visas jsonb`, `travel_history jsonb`, `has_travel_history boolean`, `has_active_foreign_visa boolean`.
- **visas table**: 8 boolean requirement flags + 5 new eligibility rule columns: `allowed_nationalities text[]`, `blocked_nationalities text[]`, `requires_gulf_residence_country text`, `requires_valid_visa_countries text[]`, `requires_invitation_letter boolean`.
- **visa_application_consents**: new table for consent audit log.
- All migrations applied via psql.

## Profile form — active visas & travel history
- `profile-edit.tsx` has two new sections: "التأشيرات السارية في دول أخرى" (hasActiveForeignVisa toggle + dynamic list) and "سجل السفر" (hasTravelHistory toggle + dynamic list).
- Arrays submitted directly in PATCH /auth/profile body — Drizzle handles JSONB serialization automatically.

## Admin visas form — eligibility fields
- `visas.tsx` visaSchema has 4 new string fields (comma-separated in form, split to arrays on submit): `allowedNationalities`, `blockedNationalities`, `requiresGulfResidenceCountry`, `requiresValidVisaCountries`.
- `requiresInvitationLetter` added to REQUIREMENT_FLAGS checkbox list.

## YAML gotcha for orval
`requiresTravelInsurance:{ type: boolean }` (no space after colon) breaks orval with "Cannot use 'in' operator to search for 'propertyNames' in boolean }". Always add space: `requiresTravelInsurance: { type: boolean }`.

**Why:** YAML block-style mapping value indicator `:` must be followed by whitespace. Without space, the YAML parser may partially misparse the flow mapping, producing a malformed intermediate schema that orval can't traverse.
