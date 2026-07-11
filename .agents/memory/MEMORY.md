# Memory Index

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
