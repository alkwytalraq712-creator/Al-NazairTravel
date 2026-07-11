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

## Gulf residence enforcement
- If a visa has `requiresGulfResidence = true` and the user's `hasGulfResidence = false`, the API returns 422 with `code: "GULF_RESIDENCE_REQUIRED"`.

## DB schema additions
- **users table**: 26 new columns (personal, passport, Gulf residence, profileCompletedAt).
- **visas table**: 8 boolean requirement flags (default false, except requiresPersonalPhoto and requiresPassportImage which default true).
- Migration applied via psql. Drizzle schemas updated in `lib/db/src/schema/`.

## Key files changed
- `lib/db/src/schema/users.ts` — all new nullable profile columns
- `lib/db/src/schema/visas.ts` — 8 requirement boolean flags
- `lib/api-spec/openapi.yaml` — User + ProfileUpdate + Visa/VisaInput/VisaUpdate extended; ProfileCompletion schema + VisaRequirements schema added; VisaApplicationInput simplified to just `{ visaId }`
- `artifacts/api-server/src/lib/auth.ts` — serializeUser extended, getProfileCompletion added, requireAuth/requireAdmin live here
- `artifacts/api-server/src/routes/auth.ts` — GET /auth/profile/completion, PATCH /auth/profile auto-tracks profileCompletedAt
- `artifacts/api-server/src/routes/visaApplications.ts` — auto-fill from profile, both gates enforced
- `artifacts/mobile-app/app/profile-edit.tsx` — full rewrite: multi-section form with image upload + progress bar
- `artifacts/mobile-app/app/apply-visa/[id].tsx` — full rewrite: profile gate wall, Gulf gate wall, one-tap submit
- `artifacts/admin-dashboard/src/pages/visas.tsx` — 8 requirement checkboxes in VisaForm

## YAML gotcha for orval
`requiresTravelInsurance:{ type: boolean }` (no space after colon) breaks orval with "Cannot use 'in' operator to search for 'propertyNames' in boolean }". Always add space: `requiresTravelInsurance: { type: boolean }`.

**Why:** YAML block-style mapping value indicator `:` must be followed by whitespace. Without space, the YAML parser may partially misparse the flow mapping, producing a malformed intermediate schema that orval can't traverse.
