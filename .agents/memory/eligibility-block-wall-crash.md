---
name: EligibilityBlockWall undefined blockers crash
description: Root cause and fix for "Cannot read properties of undefined (reading 'map')" in the visa terms screen
---

## The rule
Never call `.map()`, `.filter()`, `.some()`, `.find()`, or `.length` directly on any array prop that comes from an API response without guarding with `?? []` or `Array.isArray()`.

## Root cause
`EligibilityBlockWall` received `blockers = undefined` because:
1. The browser HTTP cache stored an old `GET /api/visas/:id/eligibility` response that had no `blockers` field (before the field was added to the API).
2. Subsequent requests returned HTTP 304 ("use cache"), so the browser served the old cached body with no `blockers`.
3. `eligibility.blockers as any` bypassed TypeScript's type check.
4. `blockers.map(...)` threw `TypeError: Cannot read properties of undefined`.

## Fix pattern applied
```tsx
// Component: default param + safe variable
function EligibilityBlockWall({
  blockers = [],
}: {
  blockers?: Array<...>;
}) {
  const safeBlockers = Array.isArray(blockers) ? blockers : [];
  // ... use safeBlockers.map(...) etc.
}

// Call site: explicit guard
<EligibilityBlockWall
  blockers={Array.isArray(eligibility.blockers) ? eligibility.blockers : []}
/>
```

## How to apply
Apply this pattern to EVERY component that receives array props from API data:
- Default the prop to `[]`
- Create a `safeX = Array.isArray(x) ? x : []` variable
- Use `safeX` for all array operations
- Guard at the call site too: `Array.isArray(data.field) ? data.field : []`

## Files fixed
- `apply-visa/terms/[id].tsx` — EligibilityBlockWall + ProfileIncompleteWall
- `visa/[id].tsx` — requiredDocuments
- `package/[id].tsx` — images, itinerary, includedServices, excludedServices
- `(tabs)/index.tsx` — popularPackages
