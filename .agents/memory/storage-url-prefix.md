---
name: Storage URL /api prefix gap
description: Why image URLs returned by finalize were 404ing and how it was fixed.
---

## The Problem
`storageRouter` is mounted inside the main Express router which is registered at `/api`:
```js
app.use("/api", router); // router.use(storageRouter) → /api/storage/objects/*
```

The `publicUrl` in `POST /api/storage/uploads/finalize` was constructed as:
```js
`${req.protocol}://${req.get('host')}/storage${objectPath}`
// → https://[domain]/storage/objects/avatar.jpg  ← WRONG (no /api)
```

So stored URLs (in avatarUrl, passportImageUrl, personalPhotoUrl) were like
`https://[domain]/storage/objects/...` but the actual route was at
`https://[domain]/api/storage/objects/...` — causing 404 on every image load.

## The Fix
Mount `storageRouter` ALSO directly at `/storage` in `app.ts` (backward-compatible):
```js
import storageRouter from "./routes/storage";
app.use("/storage", storageRouter); // serves existing stored URLs
app.use("/api", router);            // also serves /api/storage/...
```

**Why:** Changing publicUrl to include /api would break existing stored URLs already in DB. Dual-mount is backward compatible.

**How to apply:** Any time you see images returning 404 from /storage/objects/* (without /api prefix), remember this pattern. Do NOT remove the `/storage` mount.
