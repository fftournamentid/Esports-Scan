---
name: Admin UX decisions
description: Key admin dashboard architecture and UX patterns for fftournament app
---

## Tournament Management
- Each tournament in admin list shows one "MANAGE TOURNAMENT >" button
- Navigates to `/admin/manage-tournament/[id]` (file: `app/admin/manage-tournament/[id].tsx`)
- That screen has: Edit, Room Details, Results & Winners, Payment Verification, Publish toggle, Cancel, Delete

## Admin Dashboard Sections (admin-dashboard.tsx)
1. Stats Grid — 8 cards (2-column): Total Players, Total Registrations, Pending Verification, Approved, Rejected, Active Tournaments, Total Revenue, Pending Payouts
2. Quick Actions — 4 large cards: Create Tournament, Verify Payments, Winner Payments, User Management
3. Tournament Analytics — inline stats with progress bars (Approved/Pending/Rejected %)
4. Tournaments list — each card has MANAGE TOURNAMENT button
5. System Settings — links to UPI Settings, WhatsApp Settings, Email Settings, Backup

## Key rules
- **Telegram is removed everywhere** — no telegramLink field in app-settings.tsx or updatePaymentSettings
- **FloatingWhatsApp** — hidden for admin role (`userProfile?.role === 'admin'` → return null); draggable on native, position saved to AsyncStorage key `ff_whatsapp_btn_pos`; don't render until position loaded (`ready` state)
- **Logout** clears React state → signOut(auth) → AsyncStorage.clear() → router.replace('/auth/login')

**Why:** Admin should not see the user support button. Logout clearing AsyncStorage prevents stale cached state from persisting across sessions.
