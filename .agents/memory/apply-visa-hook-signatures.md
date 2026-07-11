---
name: apply-visa hook call signatures
description: useGetVisa and useGetVisaEligibility take id:number as their FIRST positional argument, not an object.
---

The orval-generated hooks for visa detail and eligibility have this signature:

```ts
useGetVisa(id: number, options?: { query?: ..., request?: ... })
useGetVisaEligibility(id: number, options?: { query?: ..., request?: ... })
```

**Why:** Passing `{ id: visaId }` as an object causes the URL to become `/api/visas/[object%20Object]` and `/api/visas/[object%20Object]/eligibility` → 400 Bad Request. This blocks the entire visa application flow after terms acceptance.

**How to apply:** Always call positionally:
```ts
// CORRECT
const { data: visa } = useGetVisa(visaId);
const { data: eligibility } = useGetVisaEligibility(visaId);

// WRONG — causes [object Object] in URL
const { data: visa } = useGetVisa({ id: visaId });
```

The same applies to `useGetPackage(id)`, `useGetVisaApplication(id)`, etc. — all generated hooks that wrap a single numeric ID use positional syntax, NOT an object wrapper.
