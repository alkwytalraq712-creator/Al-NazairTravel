---
name: Production CORS allowlist must include REPLIT_DOMAINS
description: Why the api-server CORS trusted-origins set must derive from REPLIT_DOMAINS, not only dev domains.
---

# api-server CORS: trust production domains via REPLIT_DOMAINS

The api-server's credentialed CORS allowlist (`buildTrustedOrigins` in
`artifacts/api-server/src/app.ts`) must include this repl's production
domain(s), derived from `process.env.REPLIT_DOMAINS` (comma-separated hosts,
no scheme → prefix `https://`).

**Why:** In production the admin dashboard is served from the same
`*.replit.app` origin as the API, but the browser still sends an `Origin`
header on POST. If the allowlist only contains dev domains
(`REPLIT_DEV_DOMAIN`, `REPLIT_EXPO_DEV_DOMAIN`) plus an unset
`CORS_ALLOWED_ORIGINS`, the production origin is rejected and login returns 500.
In the browser that CORS rejection surfaces as a thrown fetch → the dashboard
shows "خطأ في الاتصال / connection error". `REPLIT_DOMAINS` holds the real
production host at deploy runtime (it holds the dev host in the dev container),
so it is the reliable, no-manual-secret source for prod origins.

**How to apply:** Keep credentialed CORS strict (never `origin:true` +
`credentials:true`). Add owned prod domains via REPLIT_DOMAINS; reserve
`CORS_ALLOWED_ORIGINS` for extra custom domains. The fix only takes effect
after the user re-publishes.
