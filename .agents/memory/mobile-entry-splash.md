---
name: Mobile entry screen must not return null while auth loads
description: Why the Expo welcome/entry screen renders a branded splash instead of `return null` during the auth check.
---

# Mobile entry screen: no `return null` while auth resolves

The mobile app's entry/welcome screen (`app/index.tsx`) must render a branded
dark splash (background + logo) while the auth check is pending or a redirect is
about to fire — never `return null`.

**Why:** `return null` renders a blank WHITE screen. The auth gate depends on
`useGetCurrentUser` → `/api/auth/me`. In Expo Go the app always points at the
Replit dev domain (`EXPO_PUBLIC_DOMAIN=$REPLIT_DEV_DOMAIN`); if that request is
slow or unreachable from the physical device, `isLoading` stays true and the
user is stuck on a permanent white screen. A user reported exactly this ("blank
white app"). ErrorBoundary was ruled out (it shows a visible ErrorFallback), so
the white screen was the null render, not a crash.

**How to apply:** Any auth-gated top-level screen that would otherwise
`return null` for `isLoading`/`isAuthenticated` should return a branded
placeholder view instead. Consider a fetch timeout on `/api/auth/me` if a hung
request must fail fast rather than spin forever.

## Native app delivery reality (Expo)
The Qema mobile app is a **native Expo app**. Replit "Publish" does NOT produce
an installable app — `/mobile-app/` in production only serves an Expo landing
page (QR + store links) whose QR points at the **dev** Metro bundler. Real
end-user distribution needs a native build (EAS Build → APK/IPA → app stores).
Do not tell the user publishing makes the native app usable by end users.
