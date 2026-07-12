# Threat Model

## Project Overview

Qema Travel Platform is a travel agency application consisting of:
- **API Server** (Express 5 / Node.js 24, TypeScript): serves `POST /api/...` routes, deployed publicly on Replit autoscale
- **Admin Dashboard** (React SPA): staff/admin portal at the root path
- **Mobile App** (React Native / Expo): customer-facing mobile app
- **Database**: PostgreSQL via Drizzle ORM

Authentication is dual-mode: cookie-based sessions (admin dashboard) and JWT Bearer tokens (mobile app). Both are resolved at request time by `loadCurrentUser` middleware.

## Assets

- **User credentials** — phone/email + bcrypt password hashes, JWT tokens, session cookies
- **Personal & passport data** — full legal names, DOBs, passport numbers, nationalities, passport images, residence documents. This is highly sensitive PII used for visa applications.
- **Visa applications and booking records** — contains PII and business-sensitive data
- **Admin/staff credentials** — admin account with full system access
- **Application secrets** — `SESSION_SECRET` (used for both session signing and JWT signing), database URL, Duffel API key, OpenAI API key

## Trust Boundaries

- **Browser/Mobile to API** — all client requests cross this boundary; the API must authenticate and authorize every request; clients are untrusted
- **Public to Authenticated** — home page data (banners, visas, packages) is public; all user operations require auth
- **Customer to Admin/Staff** — customers must never access admin routes; staff permissions are role-restricted
- **Admin to Staff (Role boundary)** — admins have full access; staff have permission-restricted access. Server-side enforcement is partial.
- **API to External Services** — Duffel (flight booking), OpenAI (passport OCR / face validation), Expo Push Notifications, Google Cloud Storage

## Scan Anchors

- **Production entry points**: `artifacts/api-server/src/routes/` — all Express route files
- **Auth logic**: `artifacts/api-server/src/lib/auth.ts`, `artifacts/api-server/src/lib/loadUser.ts`
- **Highest-risk areas**: `artifacts/api-server/src/app.ts` (CORS config), `artifacts/api-server/src/routes/admin.ts` (admin/staff access), `artifacts/api-server/src/routes/auth.ts` (login/signup)
- **Admin surfaces**: all routes prefixed `/admin/` require `requireAdmin` (passes both `admin` and `staff` roles)
- **Dev-only areas**: `scripts/src/seed.ts` (seed script — not exposed in production, but contains hardcoded credentials)
- **Deployment**: public autoscale deployment at `https://qmh-ln-zyr-llsfryt-wlsy-h--alkwytalraq712.replit.app`

## Threat Categories

### Spoofing

JWT tokens and session cookies are both used for authentication. The JWT secret falls back to `"changeme"` if `SESSION_SECRET` is not set (though startup throws if unset). Session cookies are `SameSite=None; Secure` to support cross-subdomain Replit dev deployments.

CORS is configured with `origin: true` (reflect-origin) plus `credentials: true`, meaning **any website** can make credentialed requests. Any attacker-controlled page can perform actions on behalf of logged-in users. This is a high-severity CSRF vector.

### Tampering

Most admin-level data mutation routes (`PATCH`, `DELETE`) check `requireAdmin` (allowing any staff member) but do NOT enforce `requirePermission`. Staff members with any role can modify customers, payments, invoices, visa application statuses, and bookings regardless of their intended granular permissions.

Input is validated via Zod schemas on most routes. Database queries use Drizzle ORM parameterized queries throughout — no obvious SQL injection.

### Repudiation

Status history is append-only (stored as JSONB) for visa applications. No comprehensive audit log for other entities (payments, invoices).

### Information Disclosure

Admin seed script (`scripts/src/seed.ts`) hardcodes default admin credentials (`admin@qema.com` / `Admin@1234`) and logs them to stdout. If these credentials were used in production and not changed, they represent a critical account takeover risk.

No authentication endpoints have rate limiting, enabling credential enumeration and brute-force attacks.

### Denial of Service

No rate limiting on `/auth/login`, `/auth/signup`, or `/auth/forgot-password`. The passport OCR endpoint (`/ocr/passport`) does have rate limiting (10 req/min per user). File uploads via presigned URLs are capped at 15-minute TTL.

### Elevation of Privilege

`requireAdmin` middleware allows both `admin` and `staff` roles. Most `/admin/*` routes only use `requireAdmin` without a follow-up `requirePermission` call. A staff account with any permissions can access all customer data, issue notifications to all users, manage payments/invoices, and change visa application statuses. Only a subset of destructive DELETE routes check `requirePermission`.
