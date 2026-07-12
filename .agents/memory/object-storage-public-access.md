---
name: Object storage public access pattern
description: How to serve public objects without auth on the GET /storage/objects/* route
---

## Rule
`GET /storage/objects/*` must NOT use `requireAuth` middleware. Instead, use optional session auth and delegate the access decision to `canAccessObjectEntity`.

**Why:** React Native `<Image>` components and admin dashboard `<img>` tags do NOT automatically send session cookies when loading image URLs. If the route requires auth, any public image becomes inaccessible in the native app and across different sessions (e.g. admin viewing user's photos).

**How to apply:**
- Remove `requireAuth` from the GET /objects/* route
- Read `req.session?.userId` (optional)
- Call `canAccessObjectEntity({ userId: userId ? String(userId) : undefined, ... })`
- `canAccessObject` in objectAcl.ts returns `true` for `visibility:'public'` even without a userId
- Admins (checked by role in usersTable) bypass ACL entirely

## Also note
- `POST /storage/uploads/finalize` still requires `requireAuth` (only logged-in users can finalize uploads)
- The `publicUrl` returned by finalize is `${req.protocol}://${req.get('host')}/storage${objectPath}` — this works on Replit because the proxy passes through the correct Host header
