---
name: Generated API client error shape
description: How to correctly read error details from orval-generated mutation hooks' onError callback in this monorepo.
---

The orval-generated React Query mutation hooks in `@workspace/api-client-react` type their `onError` callback's error as `ErrorType<T> = ApiError<T>` (defined in `custom-fetch.ts`). `ApiError` does not have a top-level `.error` property — the parsed response body lives at `.data`.

**Why:** Some earlier pages in the admin dashboard access `error.error` directly in `onError` callbacks; this only "works" at the type level in specific inference contexts (e.g. when TError resolves loosely) and fails `tsc --noEmit` for stricter/explicit error response schemas (e.g. `ErrorType<ErrorResponse>`), producing `Property 'error' does not exist` errors.

**How to apply:** When writing a new `onError` handler for a generated mutation hook, read the server's error message via `(error as any)?.data?.error` (or type it properly against the specific `ErrorResponse` schema) rather than `error.error`, to keep `tsc --noEmit` clean.
