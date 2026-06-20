---
name: Free Fire Tournament Hub — First Booyah
description: Expo Router + Firebase Auth + Firestore mobile app; key architecture decisions and gotchas for future sessions.
---

## App branding
- App renamed to "First Booyah" everywhere: app.json, auth/login.tsx, auth/signup.tsx, home screen header.
- Header shows "FIRST BOOYAH / TOURNAMENT HUB".

## Admin role
- Admin stored in `users/{uid}.role === 'admin'` — NO custom claims.
- Firestore rules use `exists()` guard before `get()` to prevent null reference.

## Firestore rules deployment
- Local `firestore.rules` at project root. Firebase CLI not pre-installed.
- User must deploy manually via Firebase Console → Firestore → Rules, or `npx firebase-tools deploy --only firestore:rules`.
- `match_results` collection needs an explicit rule or reads will fail.

## Persistent Auth (Step 6)
- `firebase.ts` uses `initializeAuth` with `getReactNativePersistence(AsyncStorage)` on native, `indexedDBLocalPersistence + browserLocalPersistence` on web.
- Wrapped in try/catch so hot-reload fallback to `getAuth(app)` works safely.
- Users stay logged in 30+ days; logout only on explicit button press.

## Profile Completion System (Steps 2–5)
- 6 fields: name, email, phoneNumber, freeFireUid, upiId, whatsappNumber.
- `UserProfile` type has all 6 fields (phone/upiId/whatsapp optional).
- `utils/profileCompletion.ts`: `getProfileCompletion(profile)` → { percentage, completed, total:6, missingFields, canJoin }.
- `canJoin = completed >= 5` (83%+ = at least 5/6 fields filled).
- `tournament/[id].tsx` calls `getProfileCompletion` before allowing join; blocks with Alert + redirect to edit-profile.
- `edit-profile.tsx`: shows all 6 editable fields (email is read-only) + live completion progress bar.
- `profile.tsx`: shows completion card with progress bar, % label, status text, and inline "Complete Profile" button.

## Rejected Payment Flow (Step 1)
- `JoinedTournament` type has `rejectionReason?: string`.
- `registrationService.ts`: `createRegistration` dup check now EXCLUDES rejected registrations (uses `activeExisting.filter(d => d.data().status !== 'rejected')`).
- `registrationService.ts`: `rejectRegistration(id, reason?)` sets `{ status: 'rejected', rejectionReason }`.
- `tournament/[id].tsx`: `canJoin = upcoming && slotsLeft > 0 && (!existingJoin || isRejected)`.
- Shows red rejection banner (with reason if present) + full QR + UTR form for resubmission.
- "YOU HAVE JOINED" green card only shows when `existingJoin && !isRejected`.
- `payment-verification.tsx`: reject uses a cross-platform `Modal` + `TextInput` (NOT `Alert.prompt` which is iOS-only).
- Rejection reason shown on admin card when present.

## Types — extended fields
- `JoinedTournament`: added `rejectionReason?: string`.
- `UserProfile`: added `phoneNumber?`, `upiId?`, `whatsappNumber?`.
- `PaymentSettings`: has `merchantName?`, `supportEmail?`, `telegramLink?`.
- `RecentWinner`: has `paid?`, `paidAt?`, `upiId?` for winner payment tracking.

## Admin screens
- `/admin/user-management` — all users with join stats.
- `/admin/winner-payments` — mark winners paid/unpaid with optional UPI ID.
- `adminService.ts`: `subscribeAllUsers`, `subscribeWinnerPayments`, `markWinnerPaid(id, upiId?)`, `markWinnerUnpaid(id)`.

## Admin settings — extended
- `merchantName`, `supportEmail`, `telegramLink` saved in `settings/app { payment: {...} }`.

## Admin dashboard
- 4 player stat cards + 4 tournament stat numbers.
- Filter chips: All/Upcoming/Live/Completed/Cancelled.
- Menu items with live badge counts: Winner Payments (unpaid count), User Management.

## Home screen
- Sorted: Live → Upcoming (nearest-start-first) → others.

## Floating WhatsApp button
- `components/FloatingWhatsApp.tsx` — only visible when logged in and `whatsappNumber` set.
- Mounted in `_layout.tsx` inside `AppProviders`.

## Key bugs fixed
- Alert.prompt (iOS-only) → replaced with cross-platform Modal in payment-verification.
- Rejected users blocked from rejoining → fixed by excluding rejected from dup check.
- Admin dashboard "cancelled" filter empty state was double-rendering → fixed with `statusFilter !== 'cancelled'` guard.
- `cancelledAt: undefined` → must use `deleteField()` in restoreTournament.
- `createRegistration` now uses writeBatch for atomic slot counting.
- Timer guard: `pendingTimerUpdates` Set prevents N clients all writing same status update.
- Auth reload loop: `currentUserIdRef` sentinel fixes null === null guard.

## match_results collection
- Fields: `tournamentId`, `tournamentName`, `userId`, `uid`, `playerName`, `kills`, `placement`, `prize`, `createdAt`.
- `subscribeUserMatchResults(userId, cb)` queries by Firebase Auth UID.
