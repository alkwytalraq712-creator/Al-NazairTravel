# Memory Index

- [drizzle-kit push TTY prompt](drizzle-push-workaround.md) — `drizzle-kit push` can't run non-interactively here; use `generate` + manual SQL for new tables/columns.
- [Generated API error shape](api-error-shape.md) — orval `ApiError` has no `.error` field directly; read `error.data?.error`, not `error.error`, in mutation onError handlers.
- [Object storage ACL finalize pattern](object-storage-acl-finalize.md) — upload flow needs a POST /finalize call after GCS PUT to set ACL owner; without it canAccessObjectEntity always returns false.
- [api-zod barrel export name conflicts](api-zod-barrel-conflicts.md) — orval generates same names in api.ts (zod) and types/ (TS interfaces); resolve via explicit export type list + dom lib in tsconfig.
