---
name: Free Fire Tournament Hub — First Booyah
description: Expo Router + Firebase Auth + Firestore mobile app; key architecture decisions and gotchas for future sessions.
---

## App branding
- App renamed to "First Booyah" in `app.json` and home screen header ("FIRST BOOYAH / TOURNAMENT HUB").
- Admin dashboard subtitle updated to "First Booyah Tournament Manager".

## Admin role
- Admin stored in `users/{uid}.role === 'admin'` — NO custom claims.
- Firestore rules use `exists()` guard before `get()` to prevent null reference on missing user doc: `exists(...) && get(...).data.role == 'admin'`.

## Firestore rules deployment
- Local `firestore.rules` at project root, `.firebaserc` and `firebase.json` set up.
- Firebase CLI is NOT pre-installed in Replit env; `npm install -g firebase-tools` times out.
- User must deploy manually: `npx firebase-tools deploy --only firestore:rules` (after `npx firebase-tools login`), or paste rules into Firebase Console → Firestore → Rules.
- The `match_results` collection had NO rule in the originally deployed rules → permission-denied on all reads. The new `firestore.rules` adds it.

## Types — extended fields
- `JoinedTournament` now has optional `phoneNumber?: string`.
- `PaymentSettings` now has optional `merchantName?`, `supportEmail?`, `telegramLink?`.
- `RecentWinner` now has optional `paid?`, `paidAt?`, `upiId?` for winner payment tracking.

## Admin screens (new)
- `/admin/user-management` — shows all users with per-user join stats (from registrations).
- `/admin/winner-payments` — subscribe to winners collection; mark as paid with optional UPI ID; `markWinnerPaid(id, upiId?)` and `markWinnerUnpaid(id)` in `adminService.ts`.

## Admin settings — new fields
- `merchantName`, `supportEmail`, `telegramLink` saved in `settings/app { payment: {...} }` Firestore doc.
- `tournamentService.ts` `mergePayment()` extended to handle all new fields with safe defaults.

## Payment verification tabs
- Changed from 2 tabs (Pending/All) to 3 tabs (Pending/Approved/Rejected) + search bar.
- Search filters by playerName, UID, transactionId, phoneNumber, tournamentName.
- Phone number row only shown when `r.phoneNumber` exists.

## Floating WhatsApp button
- `components/FloatingWhatsApp.tsx` — absolute positioned, only shown when `firebaseUser` exists and `whatsappNumber` is set.
- Mounted in `_layout.tsx` as sibling of AuthGate Stack (inside `View style={{flex:1}}`), inside `AppProviders` so it has both Auth and Tournament context.

## Admin dashboard — stats
- Player stat cards grid (2×2): Total Players (async `getAllUsersCount`), Total Joins, Pending Verif, Unpaid Winners.
- Tournament stat row: Total/Published/Live/Cancelled.
- Tournament filter chips: All/Upcoming/Live/Completed/Cancelled.
- New menu items: Winner Payments (badge = unpaid count), User Management.
- Menu badges show live counts from Firestore subscriptions.

## Home screen — sorting
- `visible` list now sorted: Live first → Upcoming sorted nearest-start-time-first → others.

## TournamentCard — premium redesign
- Colored top strip (4px) based on category color.
- Prize pool banner ("PRIZE POOL UP TO ₹X") shows if totalPrize > 0.
- Prize row inside a muted rounded box.
- Slots count shows "/total" next to slots left.
- JOIN NOW button uses category color.
- "VIEW RESULTS" button shown for completed/closed tournaments with results.

## Firestore validation
- `createRegistration` trims all string fields before writing.
- UTR duplicate check: queries `transactionId ==` across all registrations; wraps in try/catch to handle missing index gracefully (swallows index errors, re-throws UTR-duplicate error).

## adminService.ts new exports
- `subscribeAllUsers(cb, onError)` — real-time users collection listener.
- `subscribeWinnerPayments(cb, onError)` — winners ordered by publishedAt desc, includes paid/paidAt/upiId.
- `markWinnerPaid(id, upiId?)` / `markWinnerUnpaid(id)` — updateDoc on winners collection.

## Key bugs fixed
- `cancelledAt: undefined` in `restoreTournament` silently ignored by Firestore → must use `deleteField()`. Fixed with dedicated `restoreTournament()` export in `tournamentService.ts`.
- `createRegistration`: non-atomic split writes (addDoc + separate updateDoc) → replaced with `writeBatch` that atomically creates registration + increments `slotsUsed`.
- Duplicate registration check added with `getDocs` before batch commit.
- Timer guard: `pendingTimerUpdates` Set prevents N clients all writing same status update within the same session.
- Auth reload loop: `currentUserIdRef` sentinel `'__UNSET__'` ensures first `onAuthStateChanged` always runs.
- Hardcoded WhatsApp number → now reads from `paymentSettings.whatsappNumber`.
- Admin dashboard empty state for "cancelled" filter was double-rendering — fixed by guarding with `statusFilter !== 'cancelled'`.

## match_results collection
- Fields: `tournamentId`, `tournamentName`, `userId` (Firebase Auth UID), `uid` (Free Fire UID), `playerName`, `kills`, `placement`, `prize`, `createdAt`.
- Subscription: `subscribeUserMatchResults(userId, cb)` queries by Firebase Auth UID.
- Used in `my-tournaments.tsx` Performance section for kills, best placement, recent results.

## Why — key decisions
- `isAdmin()` uses Firestore `get()` in rules: requires one extra read per rule evaluation but avoids needing custom claims or Cloud Functions for role management.
- `writeBatch` for registration: ensures `slotsUsed` count is always consistent with actual registrations.
- `FloatingWhatsApp` inside `RootLayoutNav` (not inside AuthGate): ensures it has access to both Auth + Tournament contexts while staying in front of the navigation stack.
