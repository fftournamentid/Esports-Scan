import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTournament } from '@/context/TournamentContext';
import { useColors } from '@/hooks/useColors';
import {
  subscribeAllRegistrations,
  subscribeWinnerPayments,
} from '@/services/adminService';
import type { JoinedTournament, RecentWinner } from '@/types';

const TAB_BAR_H = Platform.OS === 'ios' ? 82 : 64;

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'PENDING', color: '#FF6B00', bg: '#FF6B0020' },
  approved: { label: 'APPROVED', color: '#30D158', bg: '#30D15820' },
  room_released: { label: 'ROOM SENT', color: '#30D158', bg: '#30D15820' },
  completed: { label: 'COMPLETED', color: '#4DA6FF', bg: '#4DA6FF20' },
  rejected: { label: 'REJECTED', color: '#FF3B30', bg: '#FF3B3020' },
};

export default function PaymentsTab() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { tournaments } = useTournament();

  const [registrations, setRegistrations] = useState<JoinedTournament[]>([]);
  const [winners, setWinners] = useState<RecentWinner[]>([]);
  const [activeSection, setActiveSection] = useState<'verification' | 'payouts'>('verification');

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  useEffect(() => { const u = subscribeAllRegistrations(setRegistrations); return u; }, []);
  useEffect(() => { const u = subscribeWinnerPayments(setWinners); return u; }, []);

  const pending = registrations.filter(r => r.status === 'pending');
  const approved = registrations.filter(r => r.status === 'approved' || r.status === 'room_released' || r.status === 'completed');
  const rejected = registrations.filter(r => r.status === 'rejected');
  const unpaidWinners = winners.filter(w => !w.paid);
  const paidWinners = winners.filter(w => w.paid);

  const totalRevenue = useMemo(() =>
    approved.reduce((sum, r) => {
      const t = tournaments.find(t => t.id === r.tournamentId);
      return sum + (t?.entryFee ?? 0);
    }, 0), [approved, tournaments]);

  const recentRegs = registrations.slice(0, 15);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Payments</Text>
        <View style={[styles.revenuePill, { backgroundColor: colors.gold + '18', borderColor: colors.gold + '44' }]}>
          <Feather name="trending-up" size={13} color={colors.gold} />
          <Text style={[styles.revenueText, { color: colors.gold }]}>₹{totalRevenue.toLocaleString('en-IN')}</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: TAB_BAR_H + (Platform.OS === 'web' ? 20 : insets.bottom) + 16 },
        ]}
      >
        {/* Summary Stats */}
        <View style={styles.summaryRow}>
          {[
            { label: 'Pending', count: pending.length, color: '#FF6B00' },
            { label: 'Approved', count: approved.length, color: colors.success },
            { label: 'Rejected', count: rejected.length, color: colors.destructive },
          ].map(s => (
            <View key={s.label} style={[styles.summaryChip, { backgroundColor: s.color + '15', borderColor: s.color + '33' }]}>
              <Text style={[styles.summaryCount, { color: s.color }]}>{s.count}</Text>
              <Text style={[styles.summaryLabel, { color: s.color }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Section Toggle */}
        <View style={[styles.segmented, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.segBtn, activeSection === 'verification' && { backgroundColor: colors.primary }]}
            onPress={() => setActiveSection('verification')}
          >
            {pending.length > 0 && activeSection !== 'verification' && (
              <View style={[styles.segBadge, { backgroundColor: '#FF6B00' }]}>
                <Text style={styles.segBadgeText}>{pending.length}</Text>
              </View>
            )}
            <Text style={[styles.segText, { color: activeSection === 'verification' ? '#000' : colors.mutedForeground }]}>
              Verification
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segBtn, activeSection === 'payouts' && { backgroundColor: colors.primary }]}
            onPress={() => setActiveSection('payouts')}
          >
            {unpaidWinners.length > 0 && activeSection !== 'payouts' && (
              <View style={[styles.segBadge, { backgroundColor: colors.destructive }]}>
                <Text style={styles.segBadgeText}>{unpaidWinners.length}</Text>
              </View>
            )}
            <Text style={[styles.segText, { color: activeSection === 'payouts' ? '#000' : colors.mutedForeground }]}>
              Winner Payouts
            </Text>
          </TouchableOpacity>
        </View>

        {activeSection === 'verification' && (
          <>
            {/* Hero Action Card */}
            <TouchableOpacity
              style={[styles.heroCard, { backgroundColor: colors.card, borderColor: pending.length > 0 ? '#FF6B0055' : colors.border }]}
              onPress={() => router.push('/admin/payment-verification' as never)}
              activeOpacity={0.85}
            >
              <View style={[styles.heroIcon, { backgroundColor: pending.length > 0 ? '#FF6B0020' : colors.muted }]}>
                <Feather name="check-square" size={28} color={pending.length > 0 ? '#FF6B00' : colors.mutedForeground} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.heroTitle, { color: colors.foreground }]}>Payment Verification</Text>
                <Text style={[styles.heroSub, { color: colors.mutedForeground }]}>
                  {pending.length > 0
                    ? `${pending.length} registration(s) awaiting approval`
                    : 'All registrations processed'}
                </Text>
              </View>
              {pending.length > 0 && (
                <View style={[styles.heroBadge, { backgroundColor: '#FF6B00' }]}>
                  <Text style={styles.heroBadgeText}>{pending.length}</Text>
                </View>
              )}
              <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>

            {/* Recent Registrations */}
            <SectionTitle label="RECENT REGISTRATIONS" colors={colors} />
            {recentRegs.length === 0 ? (
              <EmptyState message="No registrations yet" colors={colors} />
            ) : (
              recentRegs.map(reg => {
                const t = tournaments.find(t => t.id === reg.tournamentId);
                const meta = STATUS_META[reg.status] ?? STATUS_META['pending'];
                return (
                  <View key={reg.id} style={[styles.regCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.regLeft}>
                      <Text style={[styles.regName, { color: colors.foreground }]} numberOfLines={1}>
                        {reg.playerName ?? 'Player'}
                      </Text>
                      <Text style={[styles.regTournament, { color: colors.mutedForeground }]} numberOfLines={1}>
                        {t?.name ?? 'Tournament'}
                      </Text>
                      {reg.utrNumber && (
                        <Text style={[styles.regUtr, { color: colors.mutedForeground }]}>UTR: {reg.utrNumber}</Text>
                      )}
                    </View>
                    <View>
                      <View style={[styles.statusPill, { backgroundColor: meta.bg }]}>
                        <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
                      </View>
                      <Text style={[styles.regFee, { color: colors.gold }]}>₹{t?.entryFee ?? 0}</Text>
                    </View>
                  </View>
                );
              })
            )}
          </>
        )}

        {activeSection === 'payouts' && (
          <>
            {/* Hero Action Card */}
            <TouchableOpacity
              style={[styles.heroCard, { backgroundColor: colors.card, borderColor: unpaidWinners.length > 0 ? colors.destructive + '55' : colors.border }]}
              onPress={() => router.push('/admin/winner-payments' as never)}
              activeOpacity={0.85}
            >
              <View style={[styles.heroIcon, { backgroundColor: unpaidWinners.length > 0 ? colors.destructive + '18' : colors.muted }]}>
                <Feather name="dollar-sign" size={28} color={unpaidWinners.length > 0 ? colors.destructive : colors.mutedForeground} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.heroTitle, { color: colors.foreground }]}>Winner Payments</Text>
                <Text style={[styles.heroSub, { color: colors.mutedForeground }]}>
                  {unpaidWinners.length > 0
                    ? `${unpaidWinners.length} winner(s) pending payment`
                    : 'All winners paid'}
                </Text>
              </View>
              {unpaidWinners.length > 0 && (
                <View style={[styles.heroBadge, { backgroundColor: colors.destructive }]}>
                  <Text style={styles.heroBadgeText}>{unpaidWinners.length}</Text>
                </View>
              )}
              <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>

            {/* Payout stats */}
            <View style={styles.payoutRow}>
              <View style={[styles.payoutChip, { backgroundColor: colors.destructive + '15', borderColor: colors.destructive + '33' }]}>
                <Text style={[styles.payoutCount, { color: colors.destructive }]}>{unpaidWinners.length}</Text>
                <Text style={[styles.payoutLabel, { color: colors.destructive }]}>Unpaid</Text>
              </View>
              <View style={[styles.payoutChip, { backgroundColor: colors.success + '15', borderColor: colors.success + '33' }]}>
                <Text style={[styles.payoutCount, { color: colors.success }]}>{paidWinners.length}</Text>
                <Text style={[styles.payoutLabel, { color: colors.success }]}>Paid</Text>
              </View>
              <View style={[styles.payoutChip, { backgroundColor: colors.gold + '15', borderColor: colors.gold + '33' }]}>
                <Text style={[styles.payoutCount, { color: colors.gold }]}>{winners.length}</Text>
                <Text style={[styles.payoutLabel, { color: colors.gold }]}>Total</Text>
              </View>
            </View>

            <SectionTitle label="UNPAID WINNERS" colors={colors} />
            {unpaidWinners.length === 0 ? (
              <EmptyState message="All winners have been paid" colors={colors} icon="check-circle" />
            ) : (
              unpaidWinners.slice(0, 10).map(w => (
                <View key={w.id} style={[styles.winnerCard, { backgroundColor: colors.card, borderColor: colors.destructive + '33' }]}>
                  <View style={[styles.winnerIcon, { backgroundColor: colors.gold + '18' }]}>
                    <Feather name="award" size={18} color={colors.gold} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.winnerName, { color: colors.foreground }]}>{w.playerName}</Text>
                    <Text style={[styles.winnerUpi, { color: colors.mutedForeground }]}>{w.upiId ?? 'No UPI set'}</Text>
                  </View>
                  <View style={[styles.winnerAmtPill, { backgroundColor: colors.gold + '18' }]}>
                    <Text style={[styles.winnerAmt, { color: colors.gold }]}>₹{w.prize ?? 0}</Text>
                  </View>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function SectionTitle({ label, colors }: { label: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, marginBottom: 8 }}>
      <View style={{ width: 3, height: 14, borderRadius: 2, backgroundColor: colors.primary }} />
      <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1.5, color: colors.mutedForeground }}>{label}</Text>
    </View>
  );
}

function EmptyState({ message, colors, icon = 'inbox' }: { message: string; colors: ReturnType<typeof useColors>; icon?: React.ComponentProps<typeof Feather>['name'] }) {
  return (
    <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Feather name={icon} size={32} color={colors.mutedForeground + '55'} />
      <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  revenuePill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, borderWidth: 1,
  },
  revenueText: { fontSize: 14, fontWeight: '800' },
  scroll: { paddingHorizontal: 16, paddingTop: 14 },

  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  summaryChip: {
    flex: 1, alignItems: 'center', paddingVertical: 12,
    borderRadius: 12, borderWidth: 1,
  },
  summaryCount: { fontSize: 22, fontWeight: '800' },
  summaryLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, marginTop: 3 },

  segmented: {
    flexDirection: 'row', borderRadius: 12, borderWidth: 1,
    padding: 4, marginBottom: 14,
  },
  segBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 10, borderRadius: 9, position: 'relative',
  },
  segBadge: {
    position: 'absolute', top: -4, right: 12,
    minWidth: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  segBadgeText: { fontSize: 10, fontWeight: '800', color: '#fff' },
  segText: { fontSize: 13, fontWeight: '700' },

  heroCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 4,
  },
  heroIcon: {
    width: 58, height: 58, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  heroTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  heroSub: { fontSize: 12, lineHeight: 17 },
  heroBadge: {
    minWidth: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6,
  },
  heroBadgeText: { fontSize: 13, fontWeight: '800', color: '#fff' },

  regCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 8,
  },
  regLeft: { flex: 1, marginRight: 12 },
  regName: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  regTournament: { fontSize: 11, marginBottom: 2 },
  regUtr: { fontSize: 10 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-end', marginBottom: 4 },
  statusText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  regFee: { fontSize: 13, fontWeight: '700', textAlign: 'right' },

  payoutRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  payoutChip: {
    flex: 1, alignItems: 'center', paddingVertical: 12,
    borderRadius: 12, borderWidth: 1,
  },
  payoutCount: { fontSize: 20, fontWeight: '800' },
  payoutLabel: { fontSize: 10, fontWeight: '700', marginTop: 3 },

  winnerCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 8,
  },
  winnerIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  winnerName: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  winnerUpi: { fontSize: 11 },
  winnerAmtPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  winnerAmt: { fontSize: 14, fontWeight: '800' },

  emptyCard: { borderRadius: 14, borderWidth: 1, padding: 36, alignItems: 'center', gap: 10 },
  emptyText: { fontSize: 13, fontWeight: '600' },
});
