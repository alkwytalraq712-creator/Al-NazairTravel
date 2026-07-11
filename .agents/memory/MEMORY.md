# Memory Index

- [drizzle-kit push TTY prompt](drizzle-push-workaround.md) — `drizzle-kit push` can't run non-interactively here; use `generate` + manual SQL for new tables/columns.
- [Generated API error shape](api-error-shape.md) — orval `ApiError` has no `.error` field directly; read `error.data?.error`, not `error.error`, in mutation onError handlers.
