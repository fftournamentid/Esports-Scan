import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { JoinStatus, useTournament } from '@/context/TournamentContext';
import { useColors } from '@/hooks/useColors';
import { subscribeUserWinners } from '@/services/registrationService';
import type { RecentWinner } from '@/types';
import { formatDateDisplay, formatTimeIST } from '@/utils/time';

type TabValue = 'all' | JoinStatus;

const TAB_OPTIONS: { value: TabValue; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'room_released', label: 'Room' },
  { value: 'completed', label: 'Done' },
  { value: 'rejected', label: 'Rejected' },
];

function parsePrize(prize: string): number {
  const n = parseInt(prize.replace(/[^0-9]/g, ''), 10);
  return isNaN(n) ? 0 : n;
}

export default function MyTournamentsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { userProfile } = useAuth();
  const { joinedTournaments, getTournamentById, registrationsLoading, registrationsError } = useTournament();
  const [activeTab, setActiveTab] = useState<TabValue>('all');

  const [userWinners, setUserWinners] = useState<RecentWinner[]>([]);
  const [winnersLoading, setWinnersLoading] = useState(false);

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  useEffect(() => {
    const freeFireUid = userProfile?.freeFireUid;
    if (!freeFireUid) return;
    setWinnersLoading(true);
    const unsub = subscribeUserWinners(
      freeFireUid,
      (winners) => { setUserWinners(winners); setWinnersLoading(false); },
      () => { setWinnersLoading(false); },
    );
    return unsub;
  }, [userProfile?.freeFireUid]);

  const filtered = activeTab === 'all'
    ? [...joinedTournaments].reverse()
    : [...joinedTournaments].filter(j => j.status === activeTab).reverse();

  // Performance metrics — computed from real Firestore data only
  const totalJoined = joinedTournaments.length;
  const completedCount = joinedTournaments.filter(j => j.status === 'completed').length;
  const totalWins = userWinners.length;
  const booyahWins = userWinners.filter(w => w.booyahWinner).length;
  const topPosition = userWinners.length > 0 ? Math.min(...userWinners.map(w => w.rank)) : null;
  const totalPrize = userWinners.reduce((sum, w) => sum + parsePrize(w.prize), 0);
  const winRate = completedCount > 0 && totalWins > 0
    ? Math.round((totalWins / completedCount) * 100)
    : null;

  const hasPerformanceData = totalJoined > 0 || totalWins > 0;

  // Loading state
  if (registrationsLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPadding + 12 }]}>
          <Text style={[styles.title, { color: colors.foreground }]}>MY TOURNAMENTS</Text>
          <Feather name="award" size={22} color={colors.primary} />
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Loading your tournaments...</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (registrationsError) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPadding + 12 }]}>
          <Text style={[styles.title, { color: colors.foreground }]}>MY TOURNAMENTS</Text>
          <Feather name="award" size={22} color={colors.primary} />
        </View>
        <View style={styles.centered}>
          <Feather name="wifi-off" size={44} color={colors.destructive} />
          <Text style={[styles.errorTitle, { color: colors.foreground }]}>Could not load tournaments</Text>
          <Text style={[styles.errorSub, { color: colors.mutedForeground }]}>
            {registrationsError.includes('index')
              ? 'A Firestore index is required. Check console for the setup link.'
              : registrationsError.includes('permission')
              ? 'Firestore permission denied. Please check your security rules.'
              : registrationsError}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding + 12 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>MY TOURNAMENTS</Text>
        <Feather name="award" size={22} color={colors.primary} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Platform.OS === 'web' ? 100 : insets.bottom + 80 }]}
      >
        {/* Performance Section — only shown when real data exists */}
        {hasPerformanceData && (
          <View style={[styles.perfCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.perfHeader}>
              <Feather name="bar-chart-2" size={14} color={colors.primary} />
              <Text style={[styles.perfTitle, { color: colors.foreground }]}>My Performance</Text>
              {winnersLoading && <ActivityIndicator size="small" color={colors.mutedForeground} style={{ marginLeft: 'auto' }} />}
            </View>

            <View style={styles.perfGrid}>
              {/* Always available from registrations */}
              <View style={[styles.perfStat, { backgroundColor: colors.muted }]}>
                <Text style={[styles.perfValue, { color: colors.primary }]}>{totalJoined}</Text>
                <Text style={[styles.perfLabel, { color: colors.mutedForeground }]}>Tournaments{'\n'}Joined</Text>
              </View>

              {completedCount > 0 && (
                <View style={[styles.perfStat, { backgroundColor: colors.muted }]}>
                  <Text style={[styles.perfValue, { color: colors.success }]}>{completedCount}</Text>
                  <Text style={[styles.perfLabel, { color: colors.mutedForeground }]}>Completed</Text>
                </View>
              )}

              {/* Only shown if winner data exists for this user */}
              {totalWins > 0 && (
                <View style={[styles.perfStat, { backgroundColor: colors.muted }]}>
                  <Text style={[styles.perfValue, { color: colors.gold }]}>{totalWins}</Text>
                  <Text style={[styles.perfLabel, { color: colors.mutedForeground }]}>Total{'\n'}Wins</Text>
                </View>
              )}

              {booyahWins > 0 && (
                <View style={[styles.perfStat, { backgroundColor: colors.muted }]}>
                  <Text style={[styles.perfValue, { color: colors.success }]}>{booyahWins}</Text>
                  <Text style={[styles.perfLabel, { color: colors.mutedForeground }]}>Booyah!{'\n'}Wins</Text>
                </View>
              )}

              {winRate !== null && (
                <View style={[styles.perfStat, { backgroundColor: colors.muted }]}>
                  <Text style={[styles.perfValue, { color: colors.accent }]}>{winRate}%</Text>
                  <Text style={[styles.perfLabel, { color: colors.mutedForeground }]}>Win{'\n'}Rate</Text>
                </View>
              )}

              {topPosition !== null && (
                <View style={[styles.perfStat, { backgroundColor: colors.muted }]}>
                  <Text style={[styles.perfValue, { color: colors.gold }]}>#{topPosition}</Text>
                  <Text style={[styles.perfLabel, { color: colors.mutedForeground }]}>Best{'\n'}Position</Text>
                </View>
              )}

              {totalPrize > 0 && (
                <View style={[styles.perfStat, { backgroundColor: colors.muted }]}>
                  <Text style={[styles.perfValue, { color: colors.primary }]}>₹{totalPrize}</Text>
                  <Text style={[styles.perfLabel, { color: colors.mutedForeground }]}>Prize{'\n'}Earned</Text>
                </View>
              )}
            </View>

            {/* Recent wins list */}
            {userWinners.length > 0 && (
              <View style={[styles.recentWins, { borderTopColor: colors.border }]}>
                <Text style={[styles.recentWinsTitle, { color: colors.mutedForeground }]}>RECENT WINS</Text>
                {[...userWinners].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()).slice(0, 3).map(w => (
                  <View key={w.id} style={[styles.winRow, { borderBottomColor: colors.border }]}>
                    <View style={[styles.rankBadge, { backgroundColor: colors.gold + '22' }]}>
                      <Text style={[styles.rankText, { color: colors.gold }]}>#{w.rank}</Text>
                    </View>
                    <View style={styles.winInfo}>
                      <Text style={[styles.winTourney, { color: colors.foreground }]} numberOfLines={1}>{w.tournamentName}</Text>
                      <Text style={[styles.winDate, { color: colors.mutedForeground }]}>
                        {new Date(w.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </Text>
                    </View>
                    <View style={styles.winRight}>
                      {w.booyahWinner && (
                        <View style={[styles.booyahChip, { backgroundColor: colors.success + '22' }]}>
                          <Text style={[styles.booyahText, { color: colors.success }]}>BOOYAH!</Text>
                        </View>
                      )}
                      <Text style={[styles.winPrize, { color: colors.primary }]}>{w.prize}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Filter Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabScroll}
          contentContainerStyle={styles.tabContent}
        >
          {TAB_OPTIONS.map(tab => {
            const active = activeTab === tab.value;
            const count = tab.value === 'all'
              ? joinedTournaments.length
              : joinedTournaments.filter(j => j.status === tab.value).length;
            return (
              <TouchableOpacity
                key={tab.value}
                onPress={() => setActiveTab(tab.value)}
                style={[
                  styles.tab,
                  { borderColor: active ? colors.primary : colors.border },
                  active && { backgroundColor: colors.primary + '22' },
                ]}
              >
                <Text style={[styles.tabText, { color: active ? colors.primary : colors.mutedForeground }]}>
                  {tab.label}
                </Text>
                {count > 0 && (
                  <View style={[styles.tabBadge, { backgroundColor: active ? colors.primary : colors.border }]}>
                    <Text style={[styles.tabBadgeText, { color: active ? colors.primaryForeground : colors.mutedForeground }]}>
                      {count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Tournament List */}
        {joinedTournaments.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="calendar" size={48} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.mutedForeground }]}>No Tournaments Yet</Text>
            <Text style={[styles.emptyText, { color: colors.border }]}>
              Join a tournament from the Home tab
            </Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="filter" size={36} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.mutedForeground }]}>No entries here</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {filtered.map(item => {
              const t = getTournamentById(item.tournamentId);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
                  activeOpacity={0.85}
                  onPress={() => {
                    if (item.status === 'room_released' && t) {
                      router.push(`/room/${item.tournamentId}` as never);
                    } else if (t?.status === 'completed' && t.results?.length) {
                      router.push(`/results/${item.tournamentId}` as never);
                    } else {
                      router.push(`/tournament/${item.tournamentId}` as never);
                    }
                  }}
                >
                  <View style={styles.cardHeader}>
                    <Text style={[styles.tourneyName, { color: colors.foreground }]} numberOfLines={1}>
                      {item.tournamentName}
                    </Text>
                    <StatusBadge type="join" status={item.status} />
                  </View>

                  <View style={styles.infoRow}>
                    <View style={styles.infoItem}>
                      <Feather name="calendar" size={11} color={colors.mutedForeground} />
                      <Text style={[styles.infoText, { color: colors.mutedForeground }]}>{formatDateDisplay(item.tournamentDate)}</Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Feather name="clock" size={11} color={colors.mutedForeground} />
                      <Text style={[styles.infoText, { color: colors.mutedForeground }]}>{formatTimeIST(item.tournamentTime)} IST</Text>
                    </View>
                  </View>

                  <View style={[styles.detailRow, { borderColor: colors.border }]}>
                    <View style={[styles.uidChip, { backgroundColor: colors.muted }]}>
                      <Text style={[styles.uidLabel, { color: colors.mutedForeground }]}>UID</Text>
                      <Text style={[styles.uidValue, { color: colors.primary }]}>{item.uid}</Text>
                    </View>
                    {item.transactionId ? (
                      <View style={[styles.uidChip, { backgroundColor: colors.muted }]}>
                        <Text style={[styles.uidLabel, { color: colors.mutedForeground }]}>TXN</Text>
                        <Text style={[styles.uidValue, { color: colors.foreground }]} numberOfLines={1}>{item.transactionId}</Text>
                      </View>
                    ) : item.hasScreenshot ? (
                      <View style={[styles.uidChip, { backgroundColor: colors.muted }]}>
                        <Feather name="image" size={11} color={colors.mutedForeground} />
                        <Text style={[styles.uidValue, { color: colors.mutedForeground }]}>Screenshot</Text>
                      </View>
                    ) : null}
                  </View>

                  {item.status === 'pending' && (
                    <View style={[styles.statusHint, { backgroundColor: colors.primary + '18' }]}>
                      <Feather name="clock" size={12} color={colors.primary} />
                      <Text style={[styles.statusHintText, { color: colors.primary }]}>Waiting for admin approval</Text>
                    </View>
                  )}
                  {item.status === 'approved' && (
                    <View style={[styles.statusHint, { backgroundColor: colors.success + '18' }]}>
                      <Feather name="check-circle" size={12} color={colors.success} />
                      <Text style={[styles.statusHintText, { color: colors.success }]}>Approved — waiting for room info</Text>
                    </View>
                  )}
                  {item.status === 'room_released' && (
                    <View style={[styles.statusHint, { backgroundColor: colors.accent + '18' }]}>
                      <Feather name="unlock" size={12} color={colors.accent} />
                      <Text style={[styles.statusHintText, { color: colors.accent }]}>Room Released — Tap to View Room ID & Password</Text>
                    </View>
                  )}
                  {item.status === 'completed' && t?.results?.length ? (
                    <View style={[styles.statusHint, { backgroundColor: colors.gold + '18' }]}>
                      <Feather name="award" size={12} color={colors.gold} />
                      <Text style={[styles.statusHintText, { color: colors.gold }]}>Results Published — Tap to View</Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 10,
  },
  title: { fontSize: 18, fontWeight: '700', letterSpacing: 2 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 4 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 },
  loadingText: { fontSize: 14, marginTop: 4 },
  errorTitle: { fontSize: 16, fontWeight: '700', textAlign: 'center' },
  errorSub: { fontSize: 13, textAlign: 'center', lineHeight: 20 },

  // Performance card
  perfCard: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 14 },
  perfHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  perfTitle: { fontSize: 14, fontWeight: '700' },
  perfGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  perfStat: { borderRadius: 10, padding: 10, alignItems: 'center', minWidth: 72, flexGrow: 1 },
  perfValue: { fontSize: 20, fontWeight: '700' },
  perfLabel: { fontSize: 10, textAlign: 'center', marginTop: 3, lineHeight: 14 },

  // Recent wins
  recentWins: { marginTop: 12, paddingTop: 12, borderTopWidth: 1 },
  recentWinsTitle: { fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  winRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 8, borderBottomWidth: 1,
  },
  rankBadge: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  rankText: { fontSize: 12, fontWeight: '700' },
  winInfo: { flex: 1 },
  winTourney: { fontSize: 13, fontWeight: '600' },
  winDate: { fontSize: 11, marginTop: 2 },
  winRight: { alignItems: 'flex-end', gap: 4 },
  booyahChip: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  booyahText: { fontSize: 9, fontWeight: '700' },
  winPrize: { fontSize: 13, fontWeight: '700' },

  // Tabs
  tabScroll: { flexGrow: 0, marginBottom: 10 },
  tabContent: { paddingBottom: 4, gap: 6 },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1,
  },
  tabText: { fontSize: 12, fontWeight: '600' },
  tabBadge: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  tabBadgeText: { fontSize: 10, fontWeight: '700' },

  // Tournament cards
  list: { gap: 12 },
  card: { borderRadius: 14, borderWidth: 1, padding: 14 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  tourneyName: { fontSize: 15, fontWeight: '700', flex: 1, marginRight: 8 },
  infoRow: { flexDirection: 'row', gap: 14, marginBottom: 8 },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  infoText: { fontSize: 11 },
  detailRow: { flexDirection: 'row', gap: 6, marginBottom: 8, borderTopWidth: 1, paddingTop: 8 },
  uidChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 6, flex: 1 },
  uidLabel: { fontSize: 10, fontWeight: '600' },
  uidValue: { fontSize: 11, fontWeight: '700', flex: 1 },
  statusHint: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8, borderRadius: 6 },
  statusHintText: { fontSize: 12, fontWeight: '600', flex: 1 },

  // Empty
  empty: { alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 40, paddingVertical: 48 },
  emptyTitle: { fontSize: 16, fontWeight: '600' },
  emptyText: { fontSize: 13, textAlign: 'center', lineHeight: 18 },
});
