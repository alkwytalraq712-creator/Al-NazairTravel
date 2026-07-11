---
name: Profile cache freshness after mutations
description: Any mobile screen that mutates user profile fields must invalidate the currentUser + profile-completion query keys, or the UI shows stale data.
---

# Profile cache freshness after mutations

The whole mobile app reads the signed-in user from `AuthContext`, backed by
`useGetCurrentUser()` (GET /auth/me) cached with `staleTime: 60_000`. The read-only
profile view (`app/my-profile.tsx`) and the completion badge derive entirely from that
cached user + `useGetProfileCompletion()`.

**Rule:** after any mutation that changes profile fields (profile edit, avatar change,
passport-scan save, residence update, etc.), in the mutation `onSuccess`:
- `queryClient.setQueryData(getGetCurrentUserQueryKey(), data)` for an instant paint, and
- `queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() })` plus
  `invalidateQueries({ queryKey: getGetProfileCompletionQueryKey() })` to reconcile.

**Why:** without this, the 60s staleTime means edits (including a new avatar URL) don't
appear when navigating back to the profile until the cache goes stale and a refocus
refetch fires — users perceive it as "my data didn't save / the photo didn't update."

**How to apply:** applies to every profile-mutating surface, not just `profile-edit.tsx`.
`setQueryData` is safe because `updateProfile` and `getCurrentUser` resolve to the same
`User` shape (both serialized through the server's `serializeUser`).

Related display note: profile name should use precedence Arabic parts
(`firstName+fatherName+grandfatherName+familyName`) → `englishName` (passport) → `fullName`,
otherwise it shows the bare signup stub because onboarding never sets `fullName`.
