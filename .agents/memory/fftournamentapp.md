---
name: Free Fire Tournament Hub
description: Expo Router + Firebase Auth + Firestore mobile app; key architecture decisions and gotchas for future sessions.
---

## Admin role
- Admin stored in `users/{uid}.role === 'admin'` — NO custom claims.
- Firestore rules use `exists()` guard before `get()` to prevent null reference on missing user doc: `exists(...) && get(...).data.role == 'admin'`.

## Firestore rules deployment
- Local `firestore.rules` at project root, `.firebaserc` and `firebase.json` set up.
- Firebase CLI is NOT pre-installed in Replit env; `npm install -g firebase-tools` times out.
- User must deploy manually: `npx firebase-tools deploy --only firestore:rules` (after `npx firebase-tools login`), or paste rules into Firebase Console → Firestore → Rules.
- The `match_results` collection had NO rule in the originally deployed rules → permission-denied on all reads. The new `firestore.rules` adds it.

## Key bugs fixed
- `cancelledAt: undefined` in `restoreTournament` silently ignored by Firestore → must use `deleteField()`. Fixed with dedicated `restoreTournament()` export in `tournamentService.ts`.
- `createRegistration`: non-atomic split writes (addDoc + separate updateDoc) → replaced with `writeBatch` that atomically creates registration + increments `slotsUsed`.
- Duplicate registration check added with `getDocs` before batch commit.
- Timer guard: `pendingTimerUpdates` Set prevents N clients all writing same status update within the same session.
- Auth reload loop: `currentUserIdRef` sentinel `'__UNSET__'` ensures first `onAuthStateChanged` always runs (null === null guard was preventing the logged-out branch from setting `registrationsLoading = false`).
- Hardcoded WhatsApp number `'917488765248'` in `join/[id].tsx` → replaced with `paymentSettings.whatsappNumber` from Firestore.
- `createdAt` Timestamp not converted in `getUserProfile` → now converts with `instanceof Timestamp ? .toDate().toISOString() : val`.

## match_results collection
- Fields: `tournamentId`, `tournamentName`, `userId` (Firebase Auth UID), `uid` (Free Fire UID), `playerName`, `kills`, `placement`, `prize`, `createdAt`.
- Subscription: `subscribeUserMatchResults(userId, cb)` queries by Firebase Auth UID.
- Used in `my-tournaments.tsx` Performance section for kills, best placement, recent results.

## Why — key decisions
- `isAdmin()` uses Firestore `get()` in rules: requires one extra read per rule evaluation but avoids needing custom claims or Cloud Functions for role management.
- `writeBatch` for registration: ensures `slotsUsed` count is always consistent with actual registrations (no orphaned writes).
