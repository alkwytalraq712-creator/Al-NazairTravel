---
name: Mobile tabs web render loop
description: All (tabs)/* routes show "Maximum update depth exceeded" in the web preview; native app is unaffected.
---

All `/(tabs)/*` routes in the Expo mobile app crash in the **web preview** (Expo web) with:

```
Error: Maximum update depth exceeded
  at forceStoreRerender (expo-router bundle)
```

**Why:** `react-native-safe-area-context`'s `useSafeAreaInsets` hook uses `useSyncExternalStore` on web. With React Compiler enabled (`transform.reactCompiler=true`), the safe area store snapshot is not considered stable, triggering continuous re-renders. This affects the `(tabs)/_layout.tsx` `ClassicTabLayout` which uses `useSafeAreaInsets` for the tab bar padding.

**Impact:** Web preview only. The native app (Expo Go / standalone) works correctly — all API calls succeed and users can navigate all tabs normally.

**Partial mitigation applied:** Changed `paddingBottom: safeAreaInsets.bottom` → `paddingBottom: isWeb ? 0 : safeAreaInsets.bottom` in ClassicTabLayout tab bar style. Added `"use no memo"` directive to ClassicTabLayout. These reduce the loop triggers but don't eliminate it on web.

**How to apply:** For a full fix, either disable React Compiler for the tab layout (`babel.config.js` exclusion), use a web-only SafeAreaProvider with `initialMetrics` that provides static zero insets, or upgrade react-native-safe-area-context to a version that handles React Compiler correctly.
