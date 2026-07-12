# Memory Index

- [E-ticket screen architecture](eticket-architecture.md) — white paper-style ticket card; two-phase UI (orange=temp, green=confirmed); SVG barcode from react-native-svg; expo-file-system for PDF rename; web PDF via hidden iframe.

- [drizzle-kit push TTY prompt](drizzle-push-workaround.md) — `drizzle-kit push` can't run non-interactively here; use `generate` + manual SQL for new tables/columns.
- [Generated API error shape](api-error-shape.md) — orval `ApiError` has no `.error` field directly; read `error.data?.error`, not `error.error`, in mutation onError handlers.
- [Object storage ACL finalize pattern](object-storage-acl-finalize.md) — upload flow needs a POST /finalize call after GCS PUT to set ACL owner; without it canAccessObjectEntity always returns false.
- [Object storage public access pattern](object-storage-public-access.md) — GET /storage/objects/* must NOT use requireAuth; use optional session + canAccessObjectEntity so public images load in native <Image> and admin dashboard without sending cookies.
- [Object storage upload API fields](object-storage-upload-api.md) — correct field names differ from old mobile code; use `name/size/uploadURL` not `fileName/folder/uploadUrl`.
- [api-zod barrel export name conflicts](api-zod-barrel-conflicts.md) — orval generates same names in api.ts (zod) and types/ (TS interfaces); resolve via explicit export type list + dom lib in tsconfig.
- [Smart Profile System](smart-profile-system.md) — visa applications auto-fill from user profile; profile must be 100% complete to apply; Gulf residence enforced per-visa.
- [api-client-react barrel duplicate exports](api-client-react-barrel.md) — after orval split-mode codegen, index.ts must export api.schemas and api once each; duplicates cause global React render loops.
- [Mobile tabs web render loop](mobile-tabs-web-loop.md) — all (tabs)/* routes crash on web preview with useSyncExternalStore loop; native app works fine; cause is react-native-safe-area-context on web with React Compiler.
- [apply-visa hook call signatures](apply-visa-hook-signatures.md) — useGetVisa and useGetVisaEligibility take id:number as FIRST arg, not an object; wrong calls cause [object Object] in URLs.
- [EligibilityBlockWall undefined blockers crash](eligibility-block-wall-crash.md) — blockers from stale HTTP 304 cache can be undefined; guard every array prop with Array.isArray() ?? [] at both call site and component level.
- [Storage URL /api prefix gap](storage-url-prefix.md) — storageRouter is under /api in Express; publicUrl was built without /api → images 404. Fix: mount storageRouter ALSO at /storage in app.ts.
- [Passport OCR with vision LLMs](passport-ocr-vision-llm.md) — don't require a strict 44-char MRZ regex; use semantic structured JSON. extractStructured: null=confident-not-passport (hard-fail), throw=recoverable (fall back).
- [OpenAI 429 integration vs personal key](openai-integration-429.md) — 429 "exceeded your quota" = billing, not code; means it fell back to a $0 personal key. Re-run setupReplitAIIntegrations + restart workflow.
- [Profile cache freshness](profile-cache-freshness.md) — profile-mutating screens must invalidate getGetCurrentUser + profile-completion keys; AuthContext caches user 60s so edits/avatars otherwise look "unsaved".
- [api-client-react dist rebuild](api-client-react-dist-rebuild.md) — @workspace/api-client-react is a composite TS project; after codegen adds new fields, must rebuild with `tsc -b lib/api-client-react/tsconfig.json --force` or mobile app sees stale .d.ts with missing fields.
- [Expo SDK package install](expo-sdk-install.md) — use `pnpm exec expo install <pkg>` not plain `pnpm add` for Expo SDK packages; plain pnpm installs wrong semver range causing Metro ENOENT watcher crash on tmp dirs.
- [useGetFlightBooking queryKey](generated-hooks-querykey.md) — generated query hooks (useGetFlightBooking etc.) require explicit `queryKey` when overriding query options; import getGet*QueryKey and pass it alongside `enabled`.
- [Hold Booking feature architecture](hold-booking-architecture.md) — new statuses `held`/`expired_hold`; holdSettings singleton table; background job in holdExpiry.ts; email service in email.ts; new hooks in api-hold.ts (not orval-generated).
- [Staff permissions column migration](staff-permissions-migration.md) — `ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions jsonb` run via `node -e "execSync('psql ...')"` (tsx not installed); null=admin/full, array=staff/restricted.
- [useColors theme unification](use-colors-unification.md) — all mobile screens must use `useColors()` hook instead of hardcoded DARK/WHITE/MUTED/BORDER constants; only GOLD/GOLD2 kept as constants for LinearGradient colors which require string literals.
- [api-staff manual hooks](api-staff-manual-hooks.md) — custom hooks in `lib/api-client-react/src/generated/api-staff.ts` using `customFetch` with `body: JSON.stringify()` pattern (NOT axios); exported from index.ts after api-hold.
