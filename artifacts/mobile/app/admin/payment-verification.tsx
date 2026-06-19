import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { JoinedTournament, JoinStatus } from '@/types';
import {
  subscribeAllRegistrations,
  updateRegistrationStatus,
} from '@/services/registrationService';
import { useColors } from '@/hooks/useColors';

type FilterTab = 'pending' | 'all';

const STATUS_COLORS: Record<JoinStatus, { bg: string; border: string; label: string }> = {
  pending: { bg: '#3B82F622', border: '#3B82F655', label: 'PENDING' },
  approved: { bg: '#22C55E22', border: '#22C55E55', label: 'APPROVED' },
  rejected: { bg: '#EF444422', border: '#EF444455', label: 'REJECTED' },
  room_released: { bg: '#22C55E22', border: '#22C55E55', label: 'ROOM SENT' },
  completed: { bg: '#F59E0B22', border: '#F59E0B55', label: 'COMPLETED' },
};

export default function PaymentVerificationScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [registrations, setRegistrations] = useState<JoinedTournament[]>([]);
  const [filter, setFilter] = useState<FilterTab>('pending');

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  useEffect(() => {
    const unsub = subscribeAllRegistrations(setRegistrations);
    return unsub;
  }, []);

  const displayed = filter === 'pending'
    ? registrations.filter(r => r.status === 'pending')
    : registrations;

  const pendingCount = registrations.filter(r => r.status === 'pending').length;
  const approvedCount = registrations.filter(r => r.status === 'approved' || r.status === 'room_released').length;
  const rejectedCount = registrations.filter(r => r.status === 'rejected').length;

  const handleApprove = async (id: string) => {
    await updateRegistrationStatus(id, 'approved');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleReject = async (id: string) => {
    await updateRegistrationStatus(id, 'rejected');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSetPending = async (id: string) => {
    await updateRegistrationStatus(id, 'pending');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPadding + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>PAYMENT VERIFICATION</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: Platform.OS === 'web' ? 40 : insets.bottom + 24 }]}
      >
        {/* Summary stats */}
        <View style={[styles.statsRow, { borderColor: colors.border }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: colors.primary }]}>{pendingCount}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>PENDING</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: colors.success }]}>{approvedCount}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>APPROVED</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: colors.destructive }]}>{rejectedCount}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>REJECTED</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: colors.foreground }]}>{registrations.length}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>TOTAL</Text>
          </View>
        </View>

        {/* Filter tabs */}
        <View style={[styles.filterRow, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.filterTab, filter === 'pending' && { backgroundColor: colors.primary }]}
            onPress={() => setFilter('pending')}
          >
            <Text style={[styles.filterTabText, { color: filter === 'pending' ? '#FFF' : colors.mutedForeground }]}>
              Pending ({pendingCount})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, filter === 'all' && { backgroundColor: colors.card }]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterTabText, { color: filter === 'all' ? colors.foreground : colors.mutedForeground }]}>
              All ({registrations.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Registration list */}
        {displayed.length === 0 ? (
          <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="check-circle" size={32} color={colors.success} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              {filter === 'pending' ? 'No Pending Registrations' : 'No Registrations Yet'}
            </Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              {filter === 'pending' ? 'All payments have been reviewed.' : 'Players who register will appear here.'}
            </Text>
          </View>
        ) : (
          displayed.map(r => {
            const isPending = r.status === 'pending';
            const isApproved = r.status === 'approved' || r.status === 'room_released';
            const isRejected = r.status === 'rejected';
            const chipInfo = STATUS_COLORS[r.status] ?? STATUS_COLORS.pending;

            return (
              <View
                key={r.id}
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.card,
                    borderColor: isApproved
                      ? colors.success + '44'
                      : isRejected
                        ? colors.destructive + '44'
                        : colors.border,
                  },
                ]}
              >
                <View style={[styles.statusStrip, {
                  backgroundColor: isApproved ? colors.success : isRejected ? colors.destructive : colors.primary,
                }]} />

                <View style={styles.cardBody}>
                  {/* Top: name + status */}
                  <View style={styles.cardTopRow}>
                    <Text style={[styles.playerName, { color: colors.foreground }]} numberOfLines={1}>
                      {r.playerName}
                    </Text>
                    <View style={[styles.statusChip, { backgroundColor: chipInfo.bg, borderColor: chipInfo.border }]}>
                      <Text style={[styles.statusChipText, {
                        color: isApproved ? colors.success : isRejected ? colors.destructive : colors.primary,
                      }]}>
                        {chipInfo.label}
                      </Text>
                    </View>
                  </View>

                  {/* Details grid */}
                  <View style={styles.detailsGrid}>
                    <View style={styles.detailRow}>
                      <Feather name="shield" size={12} color={colors.mutedForeground} />
                      <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>UID</Text>
                      <Text style={[styles.detailValue, { color: colors.foreground }]} numberOfLines={1}>
                        {r.uid || '—'}
                      </Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Feather name="award" size={12} color={colors.mutedForeground} />
                      <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>Tournament</Text>
                      <Text style={[styles.detailValue, { color: colors.foreground }]} numberOfLines={1}>
                        {r.tournamentName || '—'}
                      </Text>
                    </View>

                    <View style={[styles.detailRow, styles.utrRow, {
                      backgroundColor: r.transactionId ? colors.primary + '11' : colors.destructive + '11',
                      borderColor: r.transactionId ? colors.primary + '33' : colors.destructive + '33',
                    }]}>
                      <Feather
                        name="hash"
                        size={13}
                        color={r.transactionId ? colors.primary : colors.destructive}
                      />
                      <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>UTR / Txn ID</Text>
                      <Text style={[styles.detailValue, styles.utrValue, {
                        color: r.transactionId ? colors.primary : colors.destructive,
                      }]} numberOfLines={1} selectable>
                        {r.transactionId || 'NOT PROVIDED'}
                      </Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Feather name="clock" size={12} color={colors.mutedForeground} />
                      <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>Registered</Text>
                      <Text style={[styles.detailValue, { color: colors.mutedForeground }]}>
                        {new Date(r.joinedAt).toLocaleString('en-IN', {
                          day: '2-digit', month: 'short', hour: '2-digit',
                          minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata',
                        })} IST
                      </Text>
                    </View>
                  </View>

                  {/* Action buttons */}
                  <View style={styles.actions}>
                    {!isApproved && (
                      <TouchableOpacity
                        onPress={() => handleApprove(r.id)}
                        style={[styles.actionBtn, { backgroundColor: colors.success + '22', borderColor: colors.success + '55' }]}
                      >
                        <Feather name="check" size={13} color={colors.success} />
                        <Text style={[styles.actionBtnText, { color: colors.success }]}>Approve</Text>
                      </TouchableOpacity>
                    )}
                    {!isRejected && (
                      <TouchableOpacity
                        onPress={() => handleReject(r.id)}
                        style={[styles.actionBtn, { backgroundColor: colors.destructive + '18', borderColor: colors.destructive + '44' }]}
                      >
                        <Feather name="x" size={13} color={colors.destructive} />
                        <Text style={[styles.actionBtnText, { color: colors.destructive }]}>Reject</Text>
                      </TouchableOpacity>
                    )}
                    {(isApproved || isRejected) && (
                      <TouchableOpacity
                        onPress={() => handleSetPending(r.id)}
                        style={[styles.actionBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
                      >
                        <Feather name="rotate-ccw" size={12} color={colors.mutedForeground} />
                        <Text style={[styles.actionBtnText, { color: colors.mutedForeground }]}>Undo</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 8,
  },
  headerTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 1.5, flex: 1, textAlign: 'center' },
  backBtn: { padding: 8 },
  content: { paddingHorizontal: 16, paddingTop: 8, gap: 12 },
  statsRow: {
    flexDirection: 'row', borderRadius: 12, borderWidth: 1, overflow: 'hidden',
  },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  statNum: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 9, fontWeight: '600', letterSpacing: 0.5, marginTop: 2 },
  statDivider: { width: 1 },
  filterRow: {
    flexDirection: 'row', borderRadius: 10, borderWidth: 1, padding: 4, gap: 4,
  },
  filterTab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 7 },
  filterTabText: { fontSize: 13, fontWeight: '600' },
  empty: {
    borderRadius: 14, borderWidth: 1, padding: 32, alignItems: 'center', gap: 10,
  },
  emptyTitle: { fontSize: 15, fontWeight: '700' },
  emptySub: { fontSize: 12, textAlign: 'center', lineHeight: 18 },
  card: {
    borderRadius: 12, borderWidth: 1, overflow: 'hidden', flexDirection: 'row',
  },
  statusStrip: { width: 4 },
  cardBody: { flex: 1, padding: 12, gap: 10 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  playerName: { fontSize: 14, fontWeight: '700', flex: 1 },
  statusChip: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, borderWidth: 1,
  },
  statusChipText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  detailsGrid: { gap: 6 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  utrRow: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 6, marginTop: 2 },
  detailLabel: { fontSize: 11, minWidth: 72 },
  detailValue: { fontSize: 12, fontWeight: '500', flex: 1 },
  utrValue: { fontSize: 13, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1,
  },
  actionBtnText: { fontSize: 12, fontWeight: '600' },
});
