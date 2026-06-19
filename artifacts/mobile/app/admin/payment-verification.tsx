import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { JoinedTournament, JoinStatus } from '@/types';
import {
  approveRegistration,
  subscribeAllRegistrations,
  updateRegistrationStatus,
} from '@/services/registrationService';
import { useColors } from '@/hooks/useColors';

type FilterTab = 'pending' | 'approved' | 'rejected';

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
  const [search, setSearch] = useState('');

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  useEffect(() => {
    const unsub = subscribeAllRegistrations(setRegistrations);
    return unsub;
  }, []);

  const pendingCount = registrations.filter(r => r.status === 'pending').length;
  const approvedCount = registrations.filter(r => r.status === 'approved' || r.status === 'room_released' || r.status === 'completed').length;
  const rejectedCount = registrations.filter(r => r.status === 'rejected').length;

  const tabFiltered = useMemo(() => {
    if (filter === 'pending') return registrations.filter(r => r.status === 'pending');
    if (filter === 'approved') return registrations.filter(r => r.status === 'approved' || r.status === 'room_released' || r.status === 'completed');
    return registrations.filter(r => r.status === 'rejected');
  }, [registrations, filter]);

  const displayed = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tabFiltered;
    return tabFiltered.filter(r =>
      r.playerName?.toLowerCase().includes(q) ||
      r.uid?.toLowerCase().includes(q) ||
      r.transactionId?.toLowerCase().includes(q) ||
      r.phoneNumber?.toLowerCase().includes(q) ||
      r.tournamentName?.toLowerCase().includes(q),
    );
  }, [tabFiltered, search]);

  const handleApprove = async (id: string, tournamentId: string) => {
    await approveRegistration(id, tournamentId);
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

  const tabs: { key: FilterTab; label: string; count: number; color: string }[] = [
    { key: 'pending', label: 'Pending', count: pendingCount, color: colors.primary },
    { key: 'approved', label: 'Approved', count: approvedCount, color: colors.success },
    { key: 'rejected', label: 'Rejected', count: rejectedCount, color: colors.destructive },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPadding + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>PAYMENT VERIFICATION</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Stats */}
      <View style={[styles.statsRow, { borderColor: colors.border, marginHorizontal: 16 }]}>
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
      <View style={[styles.tabsRow, { marginHorizontal: 16, backgroundColor: colors.muted, borderColor: colors.border }]}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              filter === tab.key && { backgroundColor: tab.color + '22', borderColor: tab.color + '55', borderWidth: 1 },
            ]}
            onPress={() => setFilter(tab.key)}
          >
            <Text style={[
              styles.tabText,
              { color: filter === tab.key ? tab.color : colors.mutedForeground },
            ]}>
              {tab.label}
            </Text>
            {tab.count > 0 && (
              <View style={[styles.tabBadge, { backgroundColor: filter === tab.key ? tab.color : colors.border }]}>
                <Text style={[styles.tabBadgeText, { color: filter === tab.key ? '#FFF' : colors.mutedForeground }]}>
                  {tab.count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Search */}
      <View style={[styles.searchWrap, { marginHorizontal: 16, backgroundColor: colors.muted, borderColor: colors.border }]}>
        <Feather name="search" size={15} color={colors.mutedForeground} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name, UID, UTR, phone..."
          placeholderTextColor={colors.mutedForeground + '77'}
          style={[styles.searchInput, { color: colors.foreground }]}
          autoCapitalize="none"
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Feather name="x" size={15} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: Platform.OS === 'web' ? 40 : insets.bottom + 24 }]}
      >
        {displayed.length === 0 ? (
          <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name={search ? 'search' : 'check-circle'} size={32} color={search ? colors.mutedForeground : colors.success} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              {search ? 'No matches found' : filter === 'pending' ? 'No Pending Registrations' : filter === 'approved' ? 'No Approved Registrations' : 'No Rejected Registrations'}
            </Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              {search ? `No results for "${search}"` : filter === 'pending' ? 'All payments have been reviewed.' : 'Registrations you action will appear here.'}
            </Text>
          </View>
        ) : (
          displayed.map(r => {
            const isApproved = r.status === 'approved' || r.status === 'room_released' || r.status === 'completed';
            const isRejected = r.status === 'rejected';
            const chipInfo = STATUS_COLORS[r.status] ?? STATUS_COLORS.pending;
            const stripColor = isApproved ? colors.success : isRejected ? colors.destructive : colors.primary;

            return (
              <View
                key={r.id}
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.card,
                    borderColor: isApproved ? colors.success + '44' : isRejected ? colors.destructive + '44' : colors.border,
                  },
                ]}
              >
                <View style={[styles.statusStrip, { backgroundColor: stripColor }]} />

                <View style={styles.cardBody}>
                  <View style={styles.cardTopRow}>
                    <Text style={[styles.playerName, { color: colors.foreground }]} numberOfLines={1}>
                      {r.playerName}
                    </Text>
                    <View style={[styles.statusChip, { backgroundColor: chipInfo.bg, borderColor: chipInfo.border }]}>
                      <Text style={[styles.statusChipText, { color: stripColor }]}>
                        {chipInfo.label}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailsGrid}>
                    <View style={styles.detailRow}>
                      <Feather name="shield" size={12} color={colors.mutedForeground} />
                      <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>FF UID</Text>
                      <Text style={[styles.detailValue, { color: colors.foreground }]} selectable numberOfLines={1}>
                        {r.uid || '—'}
                      </Text>
                    </View>

                    {r.phoneNumber ? (
                      <View style={styles.detailRow}>
                        <Feather name="phone" size={12} color={colors.mutedForeground} />
                        <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>Phone</Text>
                        <Text style={[styles.detailValue, { color: colors.foreground }]} selectable numberOfLines={1}>
                          {r.phoneNumber}
                        </Text>
                      </View>
                    ) : null}

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
                      <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>UTR / Txn</Text>
                      <Text style={[styles.detailValue, styles.utrValue, {
                        color: r.transactionId ? colors.primary : colors.destructive,
                      }]} numberOfLines={1} selectable>
                        {r.transactionId || 'NOT PROVIDED'}
                      </Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Feather name="clock" size={12} color={colors.mutedForeground} />
                      <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>Joined</Text>
                      <Text style={[styles.detailValue, { color: colors.mutedForeground }]}>
                        {new Date(r.joinedAt).toLocaleString('en-IN', {
                          day: '2-digit', month: 'short', hour: '2-digit',
                          minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata',
                        })} IST
                      </Text>
                    </View>
                  </View>

                  <View style={styles.actions}>
                    {!isApproved && (
                      <TouchableOpacity
                        onPress={() => handleApprove(r.id, r.tournamentId)}
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
  statsRow: {
    flexDirection: 'row', borderRadius: 12, borderWidth: 1, overflow: 'hidden',
    marginTop: 8, marginBottom: 10,
  },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  statNum: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 9, fontWeight: '600', letterSpacing: 0.5, marginTop: 2 },
  statDivider: { width: 1 },
  tabsRow: {
    flexDirection: 'row', borderRadius: 10, borderWidth: 1, padding: 4, gap: 4,
    marginBottom: 10,
  },
  tab: {
    flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 7,
    flexDirection: 'row', justifyContent: 'center', gap: 5,
  },
  tabText: { fontSize: 12, fontWeight: '700' },
  tabBadge: {
    minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabBadgeText: { fontSize: 10, fontWeight: '700' },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    marginBottom: 10,
  },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },
  content: { paddingHorizontal: 16, paddingTop: 4, gap: 10 },
  empty: { borderRadius: 14, borderWidth: 1, padding: 32, alignItems: 'center', gap: 10 },
  emptyTitle: { fontSize: 15, fontWeight: '700' },
  emptySub: { fontSize: 12, textAlign: 'center', lineHeight: 18 },
  card: { borderRadius: 12, borderWidth: 1, overflow: 'hidden', flexDirection: 'row' },
  statusStrip: { width: 4 },
  cardBody: { flex: 1, padding: 12, gap: 10 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  playerName: { fontSize: 14, fontWeight: '700', flex: 1 },
  statusChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, borderWidth: 1 },
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
