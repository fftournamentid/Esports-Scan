import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RecentWinner } from '@/types';
import { markWinnerPaid, markWinnerUnpaid, subscribeWinnerPayments } from '@/services/adminService';
import { useColors } from '@/hooks/useColors';

type TabType = 'unpaid' | 'paid';

export default function WinnerPaymentsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [winners, setWinners] = useState<RecentWinner[]>([]);
  const [tab, setTab] = useState<TabType>('unpaid');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [upiInputs, setUpiInputs] = useState<Record<string, string>>({});

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  useEffect(() => {
    const unsub = subscribeWinnerPayments((ws) => {
      setWinners(ws);
      setLoading(false);
    });
    return unsub;
  }, []);

  const unpaidCount = winners.filter(w => !w.paid).length;
  const paidCount = winners.filter(w => w.paid).length;

  const tabFiltered = useMemo(() => {
    return tab === 'unpaid' ? winners.filter(w => !w.paid) : winners.filter(w => w.paid);
  }, [winners, tab]);

  const displayed = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tabFiltered;
    return tabFiltered.filter(w =>
      w.playerName?.toLowerCase().includes(q) ||
      w.uid?.toLowerCase().includes(q) ||
      w.tournamentName?.toLowerCase().includes(q) ||
      w.prize?.toLowerCase().includes(q),
    );
  }, [tabFiltered, search]);

  const handleMarkPaid = (w: RecentWinner) => {
    const upi = (upiInputs[w.id] ?? '').trim();
    Alert.alert(
      'Mark as Paid',
      `Mark ₹ prize to ${w.playerName} as paid?${upi ? `\nUPI: ${upi}` : ''}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Paid',
          onPress: async () => {
            setMarkingId(w.id);
            try {
              await markWinnerPaid(w.id, upi || undefined);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              setUpiInputs(prev => { const n = { ...prev }; delete n[w.id]; return n; });
            } catch {
              Alert.alert('Error', 'Failed to mark as paid. Please try again.');
            } finally {
              setMarkingId(null);
            }
          },
        },
      ],
    );
  };

  const handleMarkUnpaid = (w: RecentWinner) => {
    Alert.alert('Undo Payment', `Mark ${w.playerName}'s payment as unpaid?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Undo',
        style: 'destructive',
        onPress: async () => {
          setMarkingId(w.id);
          try {
            await markWinnerUnpaid(w.id);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          } catch {
            Alert.alert('Error', 'Failed. Please try again.');
          } finally {
            setMarkingId(null);
          }
        },
      },
    ]);
  };

  const rankColor = (rank: number) => {
    if (rank === 1) return colors.gold;
    if (rank === 2) return '#9CA3AF';
    if (rank === 3) return '#CD7F32';
    return colors.mutedForeground;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPadding + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>WINNER PAYMENTS</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Stats */}
      <View style={[styles.statsRow, { marginHorizontal: 16, borderColor: colors.border }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: colors.destructive }]}>{unpaidCount}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>PENDING</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: colors.success }]}>{paidCount}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>PAID</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: colors.foreground }]}>{winners.length}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>TOTAL</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={[styles.tabsRow, { marginHorizontal: 16, backgroundColor: colors.muted, borderColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.tab, tab === 'unpaid' && { backgroundColor: colors.destructive + '22', borderColor: colors.destructive + '55', borderWidth: 1 }]}
          onPress={() => setTab('unpaid')}
        >
          <Text style={[styles.tabText, { color: tab === 'unpaid' ? colors.destructive : colors.mutedForeground }]}>
            Pending ({unpaidCount})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'paid' && { backgroundColor: colors.success + '22', borderColor: colors.success + '55', borderWidth: 1 }]}
          onPress={() => setTab('paid')}
        >
          <Text style={[styles.tabText, { color: tab === 'paid' ? colors.success : colors.mutedForeground }]}>
            Paid ({paidCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={[styles.searchWrap, { marginHorizontal: 16, backgroundColor: colors.muted, borderColor: colors.border }]}>
        <Feather name="search" size={15} color={colors.mutedForeground} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name, UID, tournament..."
          placeholderTextColor={colors.mutedForeground + '77'}
          style={[styles.searchInput, { color: colors.foreground }]}
          autoCapitalize="none"
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
        {loading ? (
          <View style={styles.center}>
            <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Loading winners...</Text>
          </View>
        ) : displayed.length === 0 ? (
          <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="award" size={32} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              {search ? 'No matches found' : tab === 'unpaid' ? 'All payments settled!' : 'No paid winners yet'}
            </Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              {search ? `No results for "${search}"` : tab === 'unpaid' ? 'Great job! All winner payments are done.' : 'Mark winners as paid to see them here.'}
            </Text>
          </View>
        ) : (
          displayed.map(w => {
            const rc = rankColor(w.rank);
            const upi = upiInputs[w.id] ?? '';
            const busy = markingId === w.id;

            return (
              <View
                key={w.id}
                style={[styles.card, {
                  backgroundColor: colors.card,
                  borderColor: w.paid ? colors.success + '44' : colors.destructive + '44',
                }]}
              >
                <View style={[styles.rankStrip, { backgroundColor: rc }]} />

                <View style={styles.cardBody}>
                  {/* Top row */}
                  <View style={styles.cardTop}>
                    <View style={[styles.rankBadge, { backgroundColor: rc + '22', borderColor: rc + '55' }]}>
                      <Text style={[styles.rankText, { color: rc }]}>#{w.rank}</Text>
                    </View>
                    <View style={styles.winnerInfo}>
                      <View style={styles.nameRow}>
                        <Text style={[styles.winnerName, { color: colors.foreground }]} numberOfLines={1}>
                          {w.playerName}
                        </Text>
                        {w.booyahWinner && (
                          <View style={[styles.booyahBadge, { backgroundColor: colors.gold + '22', borderColor: colors.gold + '44' }]}>
                            <Text style={[styles.booyahText, { color: colors.gold }]}>BOOYAH</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.tournamentName, { color: colors.mutedForeground }]} numberOfLines={1}>
                        {w.tournamentName}
                      </Text>
                    </View>
                    <View style={[styles.prizeTag, { backgroundColor: colors.success + '18', borderColor: colors.success + '44' }]}>
                      <Text style={[styles.prizeText, { color: colors.success }]}>{w.prize}</Text>
                    </View>
                  </View>

                  {/* Details */}
                  <View style={styles.details}>
                    {w.uid ? (
                      <View style={styles.detailRow}>
                        <Feather name="shield" size={11} color={colors.mutedForeground} />
                        <Text style={[styles.detailText, { color: colors.mutedForeground }]}>
                          FF UID: <Text style={{ color: colors.foreground }}>{w.uid}</Text>
                        </Text>
                      </View>
                    ) : null}
                    <View style={styles.detailRow}>
                      <Feather name="clock" size={11} color={colors.mutedForeground} />
                      <Text style={[styles.detailText, { color: colors.mutedForeground }]}>
                        Published: {new Date(w.publishedAt).toLocaleDateString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata',
                        })}
                      </Text>
                    </View>
                    {w.paid && w.paidAt ? (
                      <View style={styles.detailRow}>
                        <Feather name="check-circle" size={11} color={colors.success} />
                        <Text style={[styles.detailText, { color: colors.success }]}>
                          Paid on {new Date(w.paidAt).toLocaleDateString('en-IN', {
                            day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata',
                          })}
                          {w.upiId ? ` via ${w.upiId}` : ''}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  {/* UPI input for unpaid */}
                  {!w.paid && (
                    <View style={[styles.upiRow, { borderColor: colors.border, backgroundColor: colors.muted }]}>
                      <Feather name="credit-card" size={13} color={colors.mutedForeground} />
                      <TextInput
                        value={upi}
                        onChangeText={v => setUpiInputs(prev => ({ ...prev, [w.id]: v }))}
                        placeholder="UPI ID (optional)"
                        placeholderTextColor={colors.mutedForeground + '77'}
                        style={[styles.upiInput, { color: colors.foreground }]}
                        autoCapitalize="none"
                        keyboardType="email-address"
                      />
                    </View>
                  )}

                  {/* Actions */}
                  <View style={styles.actions}>
                    {!w.paid ? (
                      <TouchableOpacity
                        onPress={() => handleMarkPaid(w)}
                        disabled={busy}
                        style={[styles.actionBtn, { backgroundColor: colors.success + '22', borderColor: colors.success + '55' }]}
                      >
                        <Feather name="check-circle" size={13} color={colors.success} />
                        <Text style={[styles.actionBtnText, { color: colors.success }]}>
                          {busy ? 'Saving...' : 'Mark as Paid'}
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        onPress={() => handleMarkUnpaid(w)}
                        disabled={busy}
                        style={[styles.actionBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
                      >
                        <Feather name="rotate-ccw" size={12} color={colors.mutedForeground} />
                        <Text style={[styles.actionBtnText, { color: colors.mutedForeground }]}>
                          {busy ? 'Saving...' : 'Undo Payment'}
                        </Text>
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
    flexDirection: 'row', borderRadius: 10, borderWidth: 1, padding: 4, gap: 4, marginBottom: 10,
  },
  tab: {
    flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 7,
  },
  tabText: { fontSize: 13, fontWeight: '700' },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    marginBottom: 10,
  },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },
  content: { paddingHorizontal: 16, gap: 10 },
  center: { paddingVertical: 48, alignItems: 'center' },
  loadingText: { fontSize: 14 },
  empty: { borderRadius: 14, borderWidth: 1, padding: 32, alignItems: 'center', gap: 10 },
  emptyTitle: { fontSize: 15, fontWeight: '700' },
  emptySub: { fontSize: 12, textAlign: 'center', lineHeight: 18 },
  card: { borderRadius: 14, borderWidth: 1, overflow: 'hidden', flexDirection: 'row' },
  rankStrip: { width: 4 },
  cardBody: { flex: 1, padding: 12, gap: 10 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rankBadge: {
    width: 40, height: 40, borderRadius: 10, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  rankText: { fontSize: 13, fontWeight: '800' },
  winnerInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  winnerName: { fontSize: 15, fontWeight: '700', flex: 1 },
  booyahBadge: {
    paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4, borderWidth: 1,
  },
  booyahText: { fontSize: 8, fontWeight: '800', letterSpacing: 0.5 },
  tournamentName: { fontSize: 11, marginTop: 2 },
  prizeTag: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1,
  },
  prizeText: { fontSize: 13, fontWeight: '800' },
  details: { gap: 4 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  detailText: { fontSize: 11 },
  upiRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8,
  },
  upiInput: { flex: 1, fontSize: 13, padding: 0 },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1,
  },
  actionBtnText: { fontSize: 13, fontWeight: '700' },
});
