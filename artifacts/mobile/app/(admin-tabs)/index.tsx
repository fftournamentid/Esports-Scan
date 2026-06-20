import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import StatusBadge from '@/components/StatusBadge';
import { useAuth } from '@/context/AuthContext';
import { useTournament } from '@/context/TournamentContext';
import { useColors } from '@/hooks/useColors';
import {
  getAllUsersCount,
  subscribeAllRegistrations,
  subscribeWinnerPayments,
} from '@/services/adminService';
import { formatDateDisplay, formatTimeIST } from '@/utils/time';
import type { JoinedTournament, RecentWinner } from '@/types';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const TAB_BAR_H = Platform.OS === 'ios' ? 82 : 64;

export default function AdminDashboardTab() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { userProfile } = useAuth();
  const { tournaments } = useTournament();

  const [totalPlayers, setTotalPlayers] = useState<number | null>(null);
  const [registrations, setRegistrations] = useState<JoinedTournament[]>([]);
  const [winners, setWinners] = useState<RecentWinner[]>([]);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  useEffect(() => { getAllUsersCount().then(setTotalPlayers); }, []);
  useEffect(() => { const u = subscribeAllRegistrations(setRegistrations); return u; }, []);
  useEffect(() => { const u = subscribeWinnerPayments(setWinners); return u; }, []);

  const pendingCount = registrations.filter(r => r.status === 'pending').length;
  const approvedCount = registrations.filter(r =>
    r.status === 'approved' || r.status === 'room_released' || r.status === 'completed').length;
  const rejectedCount = registrations.filter(r => r.status === 'rejected').length;

  const active = tournaments.filter(t => t.status !== 'cancelled');
  const activeCount = active.filter(t => t.status === 'upcoming' || t.status === 'live').length;
  const unpaidWinners = winners.filter(w => !w.paid).length;

  const totalRevenue = useMemo(() => {
    return registrations
      .filter(r => r.status === 'approved' || r.status === 'room_released' || r.status === 'completed')
      .reduce((sum, reg) => {
        const t = tournaments.find(t => t.id === reg.tournamentId);
        return sum + (t?.entryFee ?? 0);
      }, 0);
  }, [registrations, tournaments]);

  const totalPrize = useMemo(() =>
    active.reduce((s, t) => s + (t.booyahPrize ?? 0), 0), [active]);

  const recentTournaments = [...active]
    .filter(t => t.status !== 'completed' && t.status !== 'closed')
    .slice(-3)
    .reverse();

  const stats = [
    { label: 'Total Players', value: totalPlayers !== null ? `${totalPlayers}` : '…', icon: 'users' as const, color: colors.primary },
    { label: 'Total Registrations', value: `${registrations.length}`, icon: 'activity' as const, color: colors.accent },
    { label: 'Pending Verification', value: `${pendingCount}`, icon: 'clock' as const, color: '#FF6B00' },
    { label: 'Approved', value: `${approvedCount}`, icon: 'check-circle' as const, color: colors.success },
    { label: 'Rejected', value: `${rejectedCount}`, icon: 'x-circle' as const, color: colors.destructive },
    { label: 'Active Tournaments', value: `${activeCount}`, icon: 'zap' as const, color: colors.live },
  ];

  const toggleAnalytics = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setAnalyticsOpen(v => !v);
  };

  const pct = (v: number) =>
    registrations.length > 0 ? Math.round((v / registrations.length) * 100) : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.brand, { color: colors.primary }]}>fftournament</Text>
          <Text style={[styles.role, { color: colors.mutedForeground }]}>Admin Dashboard</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => router.push('/notifications' as never)}
            style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Feather name="bell" size={18} color={colors.foreground} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/admin/app-settings' as never)}
            style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Feather name="sliders" size={18} color={colors.foreground} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: TAB_BAR_H + (Platform.OS === 'web' ? 20 : insets.bottom) + 16 },
        ]}
      >
        {/* Welcome */}
        <View style={[styles.welcomeCard, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}>
          <View style={[styles.welcomeIcon, { backgroundColor: colors.primary + '22' }]}>
            <Feather name="shield" size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.welcomeTitle, { color: colors.primary }]}>
              Welcome, {userProfile?.name?.split(' ')[0] ?? 'Admin'}
            </Text>
            <Text style={[styles.welcomeSub, { color: colors.mutedForeground }]}>
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
          </View>
        </View>

        {/* Stats Grid */}
        <SectionTitle label="OVERVIEW" colors={colors} />
        <View style={styles.statsGrid}>
          {stats.map(s => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.statIcon, { backgroundColor: s.color + '18' }]}>
                <Feather name={s.icon} size={18} color={s.color} />
              </View>
              <Text style={[styles.statValue, { color: s.color }]} numberOfLines={1} adjustsFontSizeToFit>
                {s.value}
              </Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Collapsible Analytics */}
        <TouchableOpacity
          style={[styles.analyticsHeader, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={toggleAnalytics}
          activeOpacity={0.8}
        >
          <View style={styles.analyticsHeaderLeft}>
            <View style={[styles.analyticsHeaderIcon, { backgroundColor: colors.gold + '18' }]}>
              <Feather name="bar-chart-2" size={16} color={colors.gold} />
            </View>
            <Text style={[styles.analyticsHeaderText, { color: colors.foreground }]}>Tournament Analytics</Text>
          </View>
          <Feather name={analyticsOpen ? 'chevron-up' : 'chevron-down'} size={18} color={colors.mutedForeground} />
        </TouchableOpacity>

        {analyticsOpen && (
          <View style={[styles.analyticsBody, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.analyticRow}>
              <Text style={[styles.analyticLabel, { color: colors.mutedForeground }]}>Total Revenue</Text>
              <Text style={[styles.analyticValue, { color: colors.gold }]}>₹{totalRevenue.toLocaleString('en-IN')}</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.analyticRow}>
              <Text style={[styles.analyticLabel, { color: colors.mutedForeground }]}>Total Prize Pool</Text>
              <Text style={[styles.analyticValue, { color: colors.primary }]}>₹{totalPrize.toLocaleString('en-IN')}</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.analyticRow}>
              <Text style={[styles.analyticLabel, { color: colors.mutedForeground }]}>Pending Payouts</Text>
              <Text style={[styles.analyticValue, { color: colors.destructive }]}>{unpaidWinners} winner(s)</Text>
            </View>
            {registrations.length > 0 && (
              <>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <MiniProgress label="Approved" value={pct(approvedCount)} color={colors.success} colors={colors} />
                <MiniProgress label="Pending" value={pct(pendingCount)} color="#FF6B00" colors={colors} />
                <MiniProgress label="Rejected" value={pct(rejectedCount)} color={colors.destructive} colors={colors} />
              </>
            )}
          </View>
        )}

        {/* Recent Tournaments */}
        <SectionTitle label="RECENT TOURNAMENTS" colors={colors} />
        {recentTournaments.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="inbox" size={32} color={colors.mutedForeground + '55'} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No active tournaments</Text>
          </View>
        ) : (
          recentTournaments.map(t => {
            const catColors: Record<string, string> = { Solo: '#FF6B00', Duo: '#4DA6FF', Squad: '#30D158', '1v1': '#FF3B30' };
            const cc = catColors[t.category] ?? colors.primary;
            return (
              <View key={t.id} style={[styles.recentCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.recentStrip, { backgroundColor: cc }]} />
                <View style={styles.recentBody}>
                  <View style={styles.recentTop}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={[styles.recentName, { color: colors.foreground }]} numberOfLines={1}>{t.name}</Text>
                      <Text style={[styles.recentMeta, { color: colors.mutedForeground }]}>
                        {t.category} · {t.repeatDaily ? 'Daily' : formatDateDisplay(t.date)} · {formatTimeIST(t.time)} IST
                      </Text>
                    </View>
                    <StatusBadge type="tournament" status={t.status} />
                  </View>
                  <View style={[styles.recentStats, { borderTopColor: colors.border }]}>
                    <View style={styles.recentStat}>
                      <Text style={[styles.recentStatVal, { color: colors.primary }]}>₹{t.entryFee}</Text>
                      <Text style={[styles.recentStatLbl, { color: colors.mutedForeground }]}>Entry</Text>
                    </View>
                    <View style={[styles.recentStatDiv, { backgroundColor: colors.border }]} />
                    <View style={styles.recentStat}>
                      <Text style={[styles.recentStatVal, { color: colors.foreground }]}>{t.slotsUsed}/{t.slots}</Text>
                      <Text style={[styles.recentStatLbl, { color: colors.mutedForeground }]}>Slots</Text>
                    </View>
                    <View style={[styles.recentStatDiv, { backgroundColor: colors.border }]} />
                    <View style={styles.recentStat}>
                      <Text style={[styles.recentStatVal, { color: colors.gold }]}>₹{t.booyahPrize ?? 0}</Text>
                      <Text style={[styles.recentStatLbl, { color: colors.mutedForeground }]}>Prize</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.manageBtn, { backgroundColor: colors.primary }]}
                    onPress={() => router.push({ pathname: '/admin/manage-tournament/[id]', params: { id: t.id } } as never)}
                    activeOpacity={0.85}
                  >
                    <Feather name="settings" size={13} color="#000" />
                    <Text style={styles.manageBtnText}>MANAGE</Text>
                    <Feather name="chevron-right" size={13} color="#000" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

function SectionTitle({ label, colors }: { label: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={sectionStyles.row}>
      <View style={[sectionStyles.bar, { backgroundColor: colors.primary }]} />
      <Text style={[sectionStyles.text, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}
const sectionStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, marginBottom: 8 },
  bar: { width: 3, height: 14, borderRadius: 2 },
  text: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
});

function MiniProgress({ label, value, color, colors }: { label: string; value: number; color: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={miniStyles.row}>
      <Text style={[miniStyles.label, { color: colors.mutedForeground }]}>{label}</Text>
      <View style={[miniStyles.track, { backgroundColor: colors.muted }]}>
        <View style={[miniStyles.fill, { backgroundColor: color, width: `${value}%` as `${number}%` }]} />
      </View>
      <Text style={[miniStyles.pct, { color }]}>{value}%</Text>
    </View>
  );
}
const miniStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  label: { fontSize: 12, width: 60 },
  track: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
  pct: { fontSize: 11, fontWeight: '700', width: 36, textAlign: 'right' },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1,
  },
  brand: { fontSize: 22, fontWeight: '900', letterSpacing: 0.5 },
  role: { fontSize: 11, marginTop: 1 },
  headerActions: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 38, height: 38, borderRadius: 10, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  scroll: { paddingHorizontal: 16, paddingTop: 14 },

  welcomeCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 4,
  },
  welcomeIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  welcomeTitle: { fontSize: 15, fontWeight: '700' },
  welcomeSub: { fontSize: 12, marginTop: 2 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    borderRadius: 14, borderWidth: 1, padding: 14, alignItems: 'center', gap: 6,
    width: '47.5%', flexGrow: 1,
  },
  statIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 10, textAlign: 'center', lineHeight: 14 },

  analyticsHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: 14, borderWidth: 1, padding: 14, marginTop: 12,
  },
  analyticsHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  analyticsHeaderIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  analyticsHeaderText: { fontSize: 14, fontWeight: '700' },

  analyticsBody: {
    borderRadius: 14, borderWidth: 1, borderTopLeftRadius: 0, borderTopRightRadius: 0,
    marginTop: -2, paddingVertical: 4, paddingHorizontal: 14,
    borderTopColor: 'transparent',
  },
  analyticRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  analyticLabel: { fontSize: 13 },
  analyticValue: { fontSize: 14, fontWeight: '700' },
  divider: { height: 1 },

  emptyCard: {
    borderRadius: 14, borderWidth: 1, padding: 32,
    alignItems: 'center', gap: 10,
  },
  emptyText: { fontSize: 14, fontWeight: '600' },

  recentCard: { borderRadius: 14, borderWidth: 1, overflow: 'hidden', marginBottom: 10 },
  recentStrip: { height: 3 },
  recentBody: { padding: 14 },
  recentTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  recentName: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  recentMeta: { fontSize: 11 },
  recentStats: { flexDirection: 'row', borderTopWidth: 1, paddingTop: 10, marginBottom: 12 },
  recentStat: { flex: 1, alignItems: 'center' },
  recentStatVal: { fontSize: 14, fontWeight: '700' },
  recentStatLbl: { fontSize: 9, fontWeight: '600', letterSpacing: 0.5, marginTop: 2 },
  recentStatDiv: { width: 1 },
  manageBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 10,
  },
  manageBtnText: { fontSize: 12, fontWeight: '800', color: '#000', letterSpacing: 1 },
});
