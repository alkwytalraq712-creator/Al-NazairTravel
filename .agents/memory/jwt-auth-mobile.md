---
name: JWT auth for mobile app
description: Why session cookies fail in Expo/mobile and how JWT Bearer tokens solve it for this project.
---

# JWT Auth for Mobile App

## The Rule
The Expo mobile app MUST use JWT Bearer tokens for auth, NOT session cookies.

**Why:** Replit's reverse proxy treats the Expo dev domain (`*.expo.pike.replit.dev`) and the API domain (`*.pike.replit.dev`) as cross-site. The proxy strips `Set-Cookie` headers on cross-origin responses, so `express-session` cookies are never received by the mobile client. Sessions ARE saved to the DB but the cookie is never delivered.

## How to Apply
- Server (`artifacts/api-server`): `POST /auth/login` and `POST /auth/signup` return `{ ...user, token: string }` where token is a JWT signed with `SESSION_SECRET`.
- `loadCurrentUser` and `requireAuth` check `Authorization: Bearer <token>` header in addition to session cookie.
- Mobile (`artifacts/mobile-app`): `AuthContext.tsx` uses raw `fetch` for login/signup, saves the JWT to `AsyncStorage`, and calls `setAuthTokenGetter(() => token)` from `@workspace/api-client-react` so ALL subsequent API calls include the Bearer header.
- On app startup: token is loaded from AsyncStorage and auth token getter is initialized before `useGetCurrentUser` runs.

## Other fixes made at the same time
- `connect-pg-simple` added to esbuild `external` list in `build.mjs` — it reads `table.sql` relative to its own `__dirname`; bundling breaks that path lookup.
- Phone normalization in login: tries `+964` prefix, with/without leading 0, bare digits — handles inconsistent user input.
- `sameSite: "none"` + `secure: true` set on session cookie (used by admin dashboard web app).
