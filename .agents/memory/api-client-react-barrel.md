---
name: api-client-react barrel duplicate exports
description: After orval split-mode codegen, index.ts can end up with duplicate export * lines that cause global React render loops in the mobile app.
---

After running orval codegen in split mode (api.schemas.ts + api.ts), the barrel file `lib/api-client-react/src/index.ts` can end up with duplicate `export *` lines like:

```ts
export * from "./generated/api.schemas";
export * from "./generated/api";
// ... duplicated again below ...
export * from './generated/api';
export * from './generated/api.schemas';
```

**Why:** The duplicate re-exports cause Metro/webpack to see conflicting module instances, which breaks React Query's useSyncExternalStore subscription and triggers "Maximum update depth exceeded" on ALL screens that use any hook from the package — including the entire authenticated tab layout.

**How to apply:** After any orval codegen run, verify `lib/api-client-react/src/index.ts` has exactly ONE export line per generated file. The correct content is:
```ts
export * from "./generated/api.schemas";
export * from "./generated/api";
export { setBaseUrl, setAuthTokenGetter } from "./custom-fetch";
export type { AuthTokenGetter } from "./custom-fetch";
```
