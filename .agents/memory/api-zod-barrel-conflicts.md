---
name: api-zod barrel export name conflicts
description: How orval generates duplicate names across api.ts and types/; how to resolve cleanly.
---

Orval generates two outputs: `generated/api.ts` (zod schemas, e.g. `FinalizeUploadResponse = zod.object(...)`) and `generated/types/` (TS interfaces, e.g. `FinalizeUploadResponse { objectPath: string }`). Both export the same name, causing TS2308 ambiguity when `index.ts` does `export * from` both.

**Fix:** `index.ts` should do `export * from "./generated/api"` (zod schemas for runtime use) and then `export type { NameA, NameB, ... } from "./generated/types"` listing only types that don't conflict with zod schema names. Any type whose name is already exported as a zod schema must be omitted from the type-only list.

**Also:** The api-zod tsconfig needs `"lib": ["es2022", "dom"]` when any endpoint uses multipart/form-data, because orval generates `File` and `Blob` types which require DOM lib.

**Also:** `lib/api-client-react/src/index.ts` had duplicate `export *` lines added by an interrupted codegen run — these cause TS2308 and must be deduplicated.

**How to apply:** After every codegen run, check `lib/api-zod/src/index.ts` for duplicate export names and update the `export type { ... }` list to exclude any new names that now appear in `api.ts`.
