---
name: Web startup crashes fixed
description: Root causes of white-screen crash on Expo web startup and their fixes.
---

## Root Cause 1: useFonts hangs indefinitely on web

`useFonts` from `@expo-google-fonts/inter` never resolves on web in the Metro dev bundle. CSS font loading is async and unreliable in this setup — neither `fontsLoaded` nor `fontError` becomes true, leaving the app frozen on the spinner forever.

**Fix:** Skip the font-loading wait on `Platform.OS === 'web'`. Fonts load in the background; system/fallback fonts render immediately.

```tsx
const isWeb = Platform.OS === 'web';
if (!isWeb && !fontsLoaded && !fontError) {
  return <spinner />;
}
```

## Root Cause 2: AuthGate race condition (brief flash of wrong screen)

When `authLoading` changes to `false` and the user is null (not logged in), the old code immediately rendered `{children}` (which triggers loading the `(tabs)` screen). The redirect effect (`router.replace('/auth/login')`) only fires in the NEXT tick. This brief flash could crash if the tabs screen threw.

**Fix:** Hold the spinner until `segments` confirms the redirect has settled.

```tsx
if (!firebaseUser && !inAuthGroup) {
  return <spinner />; // redirect to /auth/login is pending
}
if (firebaseUser && isAdmin && !inAdminGroup && !ADMIN_PASSTHROUGH.has(firstSegment ?? "")) {
  return <spinner />; // redirect to /(admin-tabs)/ is pending
}
```

**Why:** React effects run after paint; navigation state (segments) updates synchronously after `router.replace()` fires, so checking `segments` is the right signal that the redirect has completed.

## Other fixes applied in the same session

- `expo-router/unstable-native-tabs` and `expo-glass-effect` broken imports removed from `(tabs)/_layout.tsx`
- `Notifications.setNotificationHandler()` in `utils/notifications.ts` guarded with `Platform.OS !== 'web'`
- Debug infrastructure added: `utils/webErrorCapture.ts` (error overlay + API posting), `utils/stepLog.ts` (step tracing), `/api/debuglog` endpoint on API server
