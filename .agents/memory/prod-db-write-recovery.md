---
name: Production DB writes / admin recovery
description: How to change a specific production DB row (e.g. reset an admin password) when executeSql prod is read-only and you must not wipe prod data.
---

# Writing to the production database from the agent

`executeSql({ environment: "production" })` is **read-only** (SELECT only) — it hits a
read replica. The agent cannot UPDATE/INSERT/DELETE prod rows directly, and must not
try to work around the guard (no psql against a prod URL, no deploy/startup DDL).

Publish only syncs **schema** (diff dev→prod). It does **not** copy data rows, except
when the user explicitly picks the "overwrite data" option in the Publish UI — which
replaces ALL prod data with dev data (destructive: loses prod-only signups).

## To mutate one specific prod row without wiping data

1. Add a **secret-guarded recovery endpoint** to the API (e.g. `POST /api/auth/admin-recovery`):
   - Disabled unless an env token is set (returns 404 when absent).
   - Constant-time compare (`crypto.timingSafeEqual`) of a caller-supplied token vs the env token.
   - On match, perform the narrow mutation (e.g. reset password of one fixed admin email, force role='admin').
2. Set the token as an env var in the **shared** environment via `setEnvVars` (NOT `requestSecrets`
   — you need to know the value to call the endpoint yourself). Shared applies to both dev and the deployment.
3. Verify against the **dev** URL, then have the user click **Publish once** (this also carries any
   pending code fixes like CORS to prod).
4. After publish, `curl` the endpoint against the **production** `primaryUrl` (from `getDeploymentInfo()`;
   API is under its artifact base path, e.g. `/api`) with the token to apply the change.
5. Optionally delete the token env var afterward to disable the endpoint (takes effect on next restart/republish).

**Why:** prod is read-only to the agent; this is the only non-destructive way to fix a single
prod row (login lockout, bad password) without the wholesale "overwrite data" republish.

**Gotcha:** admin dashboard API is gated by `role IN ('admin','staff')`, not by the permissions
column. A plain `/auth/signup` account is `role='customer'` and cannot access the dashboard even
though `permissions IS NULL`. Recovery must set/keep `role='admin'`.
