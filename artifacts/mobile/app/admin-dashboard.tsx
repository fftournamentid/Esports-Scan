import { Feather } from '@expo/vector-icons';
import { Redirect, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import StatusBadge from '@/components/StatusBadge';
import { useAuth } from '@/context/AuthContext';
import { Tournament, useTournament } from '@/context/TournamentContext';
import { useColors } from '@/hooks/useColors';
import { logOut } from '@/services/authService';
import {
  getAllUsersCount,
  subscribeAllRegistrations,
  subscribeWinnerPayments,
} from '@/services/adminService';
import { formatDateDisplay, formatTimeIST } from '@/utils/time';
import type { JoinedTournament } from '@/types';

export default function AdminDashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { userProfile, authLoading, logout } = useAuth();
  const { tournaments, cancelTournament } = useTournament();

  const [totalPlayers, setTotalPlayers] = useState<number | null>(null);
  const [allRegistrations, setAllRegistrations] = useState<JoinedTournament[]>([]);
  const [unpaidWinners, setUnpaidWinners] = useState(0);

  useEffect(() => {
    getAllUsersCount().then(setTotalPlayers);
  }, []);

  useEffect(() => {
    const unsub = subscribeAllRegistrations(setAllRegistrations);
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = subscribeWinnerPayments((ws) => {
      setUnpaidWinners(ws.filter(w => !w.paid).length);
    });
    return unsub;
  }, []);

  if (authLoading) return null;
  if (userProfile?.role !== 'admin') return <Redirect href="/" />;

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  // ─── Computed stats ────────────────────────────────────────────────
  const activeTournaments = tournaments.filter(t => t.status !== 'cancelled');
  const liveTournaments = activeTournaments.filter(t => t.status !== 'completed' && t.status !== 'closed');

  const pendingCount = allRegistrations.filter(r => r.status === 'pending').length;
  const approvedCount = allRegistrations.filter(r =>
    r.status === 'approved' || r.status === 'room_released' || r.status === 'completed',
  ).length;
  const rejectedCount = allRegistrations.filter(r => r.status === 'rejected').length;
  const activeCount = activeTournaments.filter(t => t.status === 'upcoming' || t.status === 'live').length;

  const totalRevenue = useMemo(() => {
    return allRegistrations
      .filter(r => r.status === 'approved' || r.status === 'room_released' || r.status === 'completed')
      .reduce((sum, reg) => {
        const t = tournaments.find(t => t.id === reg.tournamentId);
        return sum + (t?.entryFee ?? 0);
      }, 0);
  }, [allRegistrations, tournaments]);

  const totalPrizePool = useMemo(() => {
    return activeTournaments.reduce((sum, t) => sum + (t.booyahPrize ?? 0), 0);
  }, [activeTournaments]);

  // ─── Stats Grid data ───────────────────────────────────────────────
  const stats = [
    { label: 'Total Players', value: totalPlayers !== null ? `${totalPlayers}` : '…', icon: 'users' as const, color: colors.primary },
    { label: 'Total Registrations', value: `${allRegistrations.length}`, icon: 'activity' as const, color: colors.accent },
    { label: 'Pending Verification', value: `${pendingCount}`, icon: 'clock' as const, color: '#FF6B00' },
    { label: 'Approved', value: `${approvedCount}`, icon: 'check-circle' as const, color: colors.success },
    { label: 'Rejected', value: `${rejectedCount}`, icon: 'x-circle' as const, color: colors.destructive },
    { label: 'Active Tournaments', value: `${activeCount}`, icon: 'zap' as const, color: colors.live },
    { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}`, icon: 'trending-up' as const, color: colors.gold },
    { label: 'Pending Payouts', value: `${unpaidWinners}`, icon: 'dollar-sign' as const, color: colors.destructive },
  ];

  // ─── Quick Actions ─────────────────────────────────────────────────
  const quickActions = [
    {
      icon: 'plus-circle' as const,
      label: 'Create\nTournament',
      color: colors.primary,
      bg: colors.primary + '18',
      border: colors.primary + '33',
      onPress: () => router.push('/admin/create-tournament' as never),
    },
    {
      icon: 'check-square' as const,
      label: 'Verify\nPayments',
      color: colors.success,
      bg: colors.success + '18',
      border: colors.success + '33',
      badge: pendingCount,
      onPress: () => router.push('/admin/payment-verification' as never),
    },
    {
      icon: 'dollar-sign' as const,
      label: 'Winner\nPayments',
      color: colors.gold,
      bg: colors.gold + '18',
      border: colors.gold + '33',
      badge: unpaidWinners,
      onPress: () => router.push('/admin/winner-payments' as never),
    },
    {
      icon: 'users' as const,
      label: 'User\nManagement',
      color: colors.accent,
      bg: colors.accent + '18',
      border: colors.accent + '33',
      onPress: () => router.push('/admin/user-management' as never),
    },
  ];

  // ─── Analytics row ─────────────────────────────────────────────────
  const analytics = [
    { label: 'Total Regs.', value: allRegistrations.length, color: colors.foreground },
    { label: 'Pending', value: pendingCount, color: '#FF6B00' },
    { label: 'Approved', value: approvedCount, color: colors.success },
    { label: 'Rejected', value: rejectedCount, color: colors.destructive },
    { label: 'Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}`, color: colors.gold },
    { label: 'Prize Pool', value: `₹${totalPrizePool.toLocaleString('en-IN')}`, color: colors.primary },
  ];

  // ─── System Settings ───────────────────────────────────────────────
  const settingsItems = [
    { icon: 'credit-card' as const, label: 'UPI & Payment Settings', color: colors.primary, onPress: () => router.push('/admin/payment-settings' as never) },
    { icon: 'message-circle' as const, label: 'WhatsApp Settings', color: '#25D366', onPress: () => router.push('/admin/app-settings' as never) },
    { icon: 'mail' as const, label: 'Email Settings', color: colors.accent, onPress: () => router.push('/admin/app-settings' as never) },
    { icon: 'download' as const, label: 'Backup & Export Data', color: colors.mutedForeground, onPress: () => router.push('/admin/app-settings' as never) },
  ];

  const handleCancelTournament = (t: Tournament) => {
    Alert.alert(
      'Cancel Tournament',
      `Cancel "${t.name}"?`,
      [
        { text: 'Back', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: async () => { await cancelTournament(t.id); },
        },
      ],
    );
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => logout() },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ─── Header ───────────────────────────────────────────────── */}
      <View style={[styles.topBar, { paddingTop: topPadding + 8, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.topBarTitle, { color: colors.primary }]}>fftournament</Text>
          <Text style={[styles.topBarSub, { color: colors.mutedForeground }]}>Admin Dashboard</Text>
        </View>
        <TouchableOpacity
          onPress={handleLogout}
          style={[styles.logoutBtn, { backgroundColor: colors.destructive + '18', borderColor: colors.destructive + '44' }]}
        >
          <Feather name="log-out" size={14} color={colors.destructive} />
          <Text style={[styles.logoutBtnText, { color: colors.destructive }]}>LOGOUT</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: Platform.OS === 'web' ? 60 : insets.bottom + 24 }]}
      >
        {/* ════════════════════════════════════════════════════════════
            SECTION 1 — Statistics Grid
        ════════════════════════════════════════════════════════════ */}
        <SectionHeader label="OVERVIEW" />
        <View style={styles.statsGrid}>
          {stats.map(s => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.statIconWrap, { backgroundColor: s.color + '18' }]}>
                <Feather name={s.icon} size={18} color={s.color} />
              </View>
              <Text style={[styles.statValue, { color: s.color }]} numberOfLines={1} adjustsFontSizeToFit>{s.value}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* ════════════════════════════════════════════════════════════
            SECTION 2 — Quick Actions
        ════════════════════════════════════════════════════════════ */}
        <SectionHeader label="QUICK ACTIONS" />
        <View style={styles.quickGrid}>
          {quickActions.map(a => (
            <TouchableOpacity
              key={a.label}
              style={[styles.quickCard, { backgroundColor: a.bg, borderColor: a.border }]}
              onPress={a.onPress}
              activeOpacity={0.8}
            >
              {(a.badge ?? 0) > 0 && (
                <View style={[styles.quickBadge, { backgroundColor: a.color }]}>
                  <Text style={styles.quickBadgeText}>{a.badge}</Text>
                </View>
              )}
              <View style={[styles.quickIconWrap, { backgroundColor: a.color + '22' }]}>
                <Feather name={a.icon} size={28} color={a.color} />
              </View>
              <Text style={[styles.quickLabel, { color: a.color }]}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ════════════════════════════════════════════════════════════
            SECTION 3 — Tournament Analytics
        ════════════════════════════════════════════════════════════ */}
        <SectionHeader label="TOURNAMENT ANALYTICS" />
        <View style={[styles.analyticsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.analyticsGrid}>
            {analytics.map((a, i) => (
              <React.Fragment key={a.label}>
                <View style={styles.analyticItem}>
                  <Text style={[styles.analyticValue, { color: a.color }]} numberOfLines={1} adjustsFontSizeToFit>{a.value}</Text>
                  <Text style={[styles.analyticLabel, { color: colors.mutedForeground }]}>{a.label}</Text>
                </View>
                {i % 3 !== 2 && <View style={[styles.analyticDivider, { backgroundColor: colors.border }]} />}
              </React.Fragment>
            ))}
          </View>

          {/* Progress bars */}
          {allRegistrations.length > 0 && (
            <View style={[styles.progressSection, { borderTopColor: colors.border }]}>
              <ProgressBar label="Approved" value={approvedCount} total={allRegistrations.length} color={colors.success} colors={colors} />
              <ProgressBar label="Pending" value={pendingCount} total={allRegistrations.length} color="#FF6B00" colors={colors} />
              <ProgressBar label="Rejected" value={rejectedCount} total={allRegistrations.length} color={colors.destructive} colors={colors} />
            </View>
          )}
        </View>

        {/* ════════════════════════════════════════════════════════════
            SECTION 4 — Live Tournaments
        ════════════════════════════════════════════════════════════ */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionHeaderLeft}>
            <View style={[styles.sectionDot, { backgroundColor: colors.live }]} />
            <Text style={[styles.sectionHeaderText, { color: colors.foreground }]}>TOURNAMENTS</Text>
            <View style={[styles.sectionCount, { backgroundColor: colors.primary + '22' }]}>
              <Text style={[styles.sectionCountText, { color: colors.primary }]}>{activeTournaments.length}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/admin/create-tournament' as never)}
          >
            <Feather name="plus" size={14} color="#000" />
            <Text style={styles.addBtnText}>ADD NEW</Text>
          </TouchableOpacity>
        </View>

        {liveTournaments.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="inbox" size={36} color={colors.mutedForeground + '55'} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No active tournaments</Text>
            <Text style={[styles.emptyHint, { color: colors.border }]}>Tap ADD NEW to create one</Text>
          </View>
        ) : (
          [...liveTournaments].reverse().map(t => (
            <TournamentRow
              key={t.id}
              t={t}
              allRegistrations={allRegistrations}
              colors={colors}
              onManage={() => router.push({ pathname: '/admin/manage-tournament/[id]', params: { id: t.id } } as never)}
              onCancel={() => handleCancelTournament(t)}
            />
          ))
        )}

        {/* Completed / past tournaments */}
        {activeTournaments.filter(t => t.status === 'completed' || t.status === 'closed').length > 0 && (
          <>
            <SectionHeader label="COMPLETED TOURNAMENTS" />
            {activeTournaments
              .filter(t => t.status === 'completed' || t.status === 'closed')
              .reverse()
              .map(t => (
                <TournamentRow
                  key={t.id}
                  t={t}
                  allRegistrations={allRegistrations}
                  colors={colors}
                  onManage={() => router.push({ pathname: '/admin/manage-tournament/[id]', params: { id: t.id } } as never)}
                  onCancel={() => handleCancelTournament(t)}
                />
              ))}
          </>
        )}

        {/* ════════════════════════════════════════════════════════════
            SECTION 5 — System Settings
        ════════════════════════════════════════════════════════════ */}
        <SectionHeader label="SYSTEM SETTINGS" />
        <View style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {settingsItems.map((item, i) => (
            <TouchableOpacity
              key={item.label}
              style={[
                styles.settingsRow,
                { borderBottomColor: colors.border, borderBottomWidth: i < settingsItems.length - 1 ? 1 : 0 },
              ]}
              onPress={item.onPress}
              activeOpacity={0.75}
            >
              <View style={[styles.settingsIcon, { backgroundColor: item.color + '18' }]}>
                <Feather name={item.icon} size={16} color={item.color} />
              </View>
              <Text style={[styles.settingsLabel, { color: colors.foreground }]}>{item.label}</Text>
              <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({ label }: { label: string }) {
  const colors = useColors();
  return (
    <View style={sectionHeaderStyles.wrap}>
      <View style={[sectionHeaderStyles.line, { backgroundColor: colors.primary }]} />
      <Text style={[sectionHeaderStyles.text, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

const sectionHeaderStyles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, marginBottom: 6 },
  line: { width: 3, height: 14, borderRadius: 2 },
  text: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
});

function ProgressBar({ label, value, total, color, colors }: {
  label: string; value: number; total: number; color: string;
  colors: ReturnType<typeof useColors>;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <View style={progressStyles.row}>
      <Text style={[progressStyles.label, { color: colors.mutedForeground }]}>{label}</Text>
      <View style={[progressStyles.track, { backgroundColor: colors.muted }]}>
        <View style={[progressStyles.fill, { backgroundColor: color, width: `${pct}%` as `${number}%` }]} />
      </View>
      <Text style={[progressStyles.pct, { color }]}>{pct}%</Text>
    </View>
  );
}

const progressStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  label: { fontSize: 12, width: 60 },
  track: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
  pct: { fontSize: 11, fontWeight: '700', width: 36, textAlign: 'right' },
});

const CATEGORY_COLORS: Record<string, string> = {
  Solo: '#FF6B00', Duo: '#4DA6FF', Squad: '#30D158', '1v1': '#FF3B30',
};

function TournamentRow({ t, allRegistrations, colors, onManage, onCancel }: {
  t: Tournament;
  allRegistrations: JoinedTournament[];
  colors: ReturnType<typeof useColors>;
  onManage: () => void;
  onCancel: () => void;
}) {
  const catColor = CATEGORY_COLORS[t.category] ?? colors.primary;
  const tRegs = allRegistrations.filter(r => r.tournamentId === t.id);
  const tPending = tRegs.filter(r => r.status === 'pending').length;

  return (
    <View style={[rowStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[rowStyles.strip, { backgroundColor: catColor }]} />
      <View style={rowStyles.body}>
        <View style={rowStyles.top}>
          <View style={rowStyles.topLeft}>
            <Text style={[rowStyles.name, { color: colors.foreground }]} numberOfLines={1}>{t.name}</Text>
            <View style={rowStyles.metaRow}>
              <View style={[rowStyles.catChip, { backgroundColor: catColor + '22', borderColor: catColor + '44' }]}>
                <Text style={[rowStyles.catChipText, { color: catColor }]}>{t.category}</Text>
              </View>
              <Text style={[rowStyles.metaText, { color: colors.mutedForeground }]}>
                {t.repeatDaily ? 'Daily' : formatDateDisplay(t.date)} · {formatTimeIST(t.time)} IST
              </Text>
            </View>
          </View>
          <StatusBadge type="tournament" status={t.status} />
        </View>

        <View style={[rowStyles.statsRow, { borderTopColor: colors.border, borderBottomColor: colors.border }]}>
          <View style={rowStyles.statItem}>
            <Text style={[rowStyles.statVal, { color: colors.primary }]}>₹{t.entryFee}</Text>
            <Text style={[rowStyles.statLbl, { color: colors.mutedForeground }]}>Entry</Text>
          </View>
          <View style={[rowStyles.statDivider, { backgroundColor: colors.border }]} />
          <View style={rowStyles.statItem}>
            <Text style={[rowStyles.statVal, { color: colors.foreground }]}>{t.slotsUsed}/{t.slots}</Text>
            <Text style={[rowStyles.statLbl, { color: colors.mutedForeground }]}>Slots</Text>
          </View>
          <View style={[rowStyles.statDivider, { backgroundColor: colors.border }]} />
          <View style={rowStyles.statItem}>
            <Text style={[rowStyles.statVal, { color: tPending > 0 ? '#FF6B00' : colors.success }]}>{tPending}</Text>
            <Text style={[rowStyles.statLbl, { color: colors.mutedForeground }]}>Pending</Text>
          </View>
          <View style={[rowStyles.statDivider, { backgroundColor: colors.border }]} />
          <View style={rowStyles.statItem}>
            <Text style={[rowStyles.statVal, { color: t.published ? colors.success : colors.mutedForeground }]}>
              {t.published ? 'Live' : 'Draft'}
            </Text>
            <Text style={[rowStyles.statLbl, { color: colors.mutedForeground }]}>Status</Text>
          </View>
        </View>

        <View style={rowStyles.actions}>
          <TouchableOpacity
            style={[rowStyles.manageBtn, { backgroundColor: colors.primary }]}
            onPress={onManage}
            activeOpacity={0.85}
          >
            <Feather name="settings" size={14} color="#000" />
            <Text style={rowStyles.manageBtnText}>MANAGE TOURNAMENT</Text>
            <Feather name="chevron-right" size={14} color="#000" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  card: { borderRadius: 14, borderWidth: 1, overflow: 'hidden', marginBottom: 10 },
  strip: { height: 3 },
  body: { padding: 14 },
  top: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 },
  topLeft: { flex: 1, marginRight: 8 },
  name: { fontSize: 15, fontWeight: '700', marginBottom: 5 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  catChip: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5, borderWidth: 1 },
  catChipText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  metaText: { fontSize: 11 },
  statsRow: {
    flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1,
    paddingVertical: 10, marginBottom: 10,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 14, fontWeight: '700' },
  statLbl: { fontSize: 9, fontWeight: '600', letterSpacing: 0.5, marginTop: 2 },
  statDivider: { width: 1 },
  actions: {},
  manageBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 12, borderRadius: 10,
  },
  manageBtnText: { fontSize: 13, fontWeight: '800', color: '#000', letterSpacing: 1 },
});

// ─── Main Styles ───────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1,
  },
  topBarTitle: { fontSize: 22, fontWeight: '900', letterSpacing: 1 },
  topBarSub: { fontSize: 11, marginTop: 1 },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1,
  },
  logoutBtnText: { fontSize: 12, fontWeight: '700' },

  scroll: { paddingHorizontal: 16, paddingTop: 14 },

  // Stats
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    borderRadius: 14, borderWidth: 1, padding: 14, alignItems: 'center', gap: 6,
    width: '47.5%', flexGrow: 1,
  },
  statIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 10, textAlign: 'center', lineHeight: 14 },

  // Quick Actions
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickCard: {
    borderRadius: 16, borderWidth: 1, padding: 18, alignItems: 'center', gap: 10,
    width: '47.5%', flexGrow: 1, position: 'relative', overflow: 'hidden',
  },
  quickBadge: {
    position: 'absolute', top: 10, right: 10,
    minWidth: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  quickBadgeText: { fontSize: 11, fontWeight: '800', color: '#000' },
  quickIconWrap: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontSize: 12, fontWeight: '700', textAlign: 'center', lineHeight: 17 },

  // Analytics
  analyticsCard: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  analyticsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingVertical: 4 },
  analyticItem: { width: '33.33%', alignItems: 'center', paddingVertical: 14 },
  analyticValue: { fontSize: 18, fontWeight: '800' },
  analyticLabel: { fontSize: 10, marginTop: 3, textAlign: 'center' },
  analyticDivider: { width: 1, alignSelf: 'stretch' },
  progressSection: { paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 1, gap: 10 },

  // Section header
  sectionHeaderRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 14, marginBottom: 8,
  },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionDot: { width: 8, height: 8, borderRadius: 4 },
  sectionHeaderText: { fontSize: 12, fontWeight: '700', letterSpacing: 1.5 },
  sectionCount: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  sectionCountText: { fontSize: 11, fontWeight: '700' },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
  },
  addBtnText: { fontSize: 12, fontWeight: '800', color: '#000', letterSpacing: 0.5 },

  // Empty
  emptyCard: {
    borderRadius: 14, borderWidth: 1, padding: 32,
    alignItems: 'center', gap: 8,
  },
  emptyText: { fontSize: 15, fontWeight: '600' },
  emptyHint: { fontSize: 12 },

  // Settings
  settingsCard: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  settingsRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  settingsIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  settingsLabel: { fontSize: 14, fontWeight: '600', flex: 1 },
});
