import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AnnouncementCarousel from '@/components/AnnouncementCarousel';
import DropdownPicker from '@/components/DropdownPicker';
import TournamentCard from '@/components/TournamentCard';
import { RecentWinner, TournamentCategory, TournamentStatus, useTournament } from '@/context/TournamentContext';
import { useColors } from '@/hooks/useColors';
import type { AppNotification, JoinStatus } from '@/types';
import { subscribeNotifications } from '@/services/firestoreNotificationService';

const LAST_READ_KEY = 'ff_notif_last_read';

const STATUS_OPTIONS: { label: string; value: 'all' | TournamentStatus }[] = [
  { label: 'All Status', value: 'all' },
  { label: 'Upcoming', value: 'upcoming' },
  { label: 'Live', value: 'live' },
  { label: 'Completed', value: 'completed' },
];

const CATEGORY_OPTIONS: { label: string; value: 'all' | TournamentCategory }[] = [
  { label: 'All Modes', value: 'all' },
  { label: 'Solo', value: 'Solo' },
  { label: 'Duo', value: 'Duo' },
  { label: 'Squad', value: 'Squad' },
  { label: '1v1', value: '1v1' },
];

const RANK_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];
const RANK_LABELS = ['🥇', '🥈', '🥉'];

function formatWinnerDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function WinnerCard({ winner }: { winner: RecentWinner }) {
  const colors = useColors();
  const rankColor = RANK_COLORS[winner.rank - 1] ?? colors.primary;
  const rankEmoji = RANK_LABELS[winner.rank - 1] ?? `#${winner.rank}`;
  const isBooyah = !!winner.booyahWinner;

  return (
    <View style={[
      winnerStyles.card,
      { backgroundColor: colors.card, borderColor: isBooyah ? '#FF6B00' + '77' : rankColor + '55' },
    ]}>
      <View style={[winnerStyles.rankBadge, { backgroundColor: rankColor + '20' }]}>
        <Text style={winnerStyles.rankEmoji}>{rankEmoji}</Text>
      </View>
      <Text style={[winnerStyles.playerName, { color: colors.foreground }]} numberOfLines={1}>
        {winner.playerName}
      </Text>
      {winner.uid ? (
        <Text style={[winnerStyles.uid, { color: colors.mutedForeground }]} numberOfLines={1}>
          UID: {winner.uid}
        </Text>
      ) : null}
      <Text style={[winnerStyles.prize, { color: rankColor }]}>{winner.prize}</Text>
      <Text style={[winnerStyles.tournamentName, { color: colors.mutedForeground }]} numberOfLines={1}>
        {winner.tournamentName}
      </Text>
      {isBooyah && (
        <View style={winnerStyles.booyahBadge}>
          <Text style={winnerStyles.booyahText}>🔥 BOOYAH</Text>
        </View>
      )}
      <Text style={[winnerStyles.date, { color: colors.border }]}>
        {formatWinnerDate(winner.publishedAt)}
      </Text>
    </View>
  );
}

function RecentWinnersSection({ winners }: { winners: RecentWinner[] }) {
  const colors = useColors();
  return (
    <View style={[winnersStyles.section, { borderBottomColor: colors.border }]}>
      <View style={winnersStyles.sectionHeader}>
        <Text style={winnersStyles.trophy}>🏆</Text>
        <Text style={[winnersStyles.sectionTitle, { color: colors.foreground }]}>Recent Winners</Text>
        <View style={[winnersStyles.countBadge, { backgroundColor: colors.primary + '22', borderColor: colors.primary + '44' }]}>
          <Text style={[winnersStyles.countText, { color: colors.primary }]}>{winners.length}</Text>
        </View>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={winnersStyles.scrollRow}
      >
        {winners.map(w => <WinnerCard key={w.id} winner={w} />)}
      </ScrollView>
    </View>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { tournaments, joinedTournaments, recentWinners, getJoinByTournamentId } = useTournament();

  const [statusFilter, setStatusFilter] = useState<'all' | TournamentStatus>('all');
  const [catFilter, setCatFilter] = useState<'all' | TournamentCategory>('all');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let lastRead = '';

    AsyncStorage.getItem(LAST_READ_KEY).then((val) => { lastRead = val ?? ''; });

    const unsub = subscribeNotifications((ns) => {
      const count = ns.filter((n) =>
        !lastRead || new Date(n.createdAt) > new Date(lastRead),
      ).length;
      setUnreadCount(count);
    });
    return unsub;
  }, []);

  const visible = tournaments
    .filter(t => t.published && t.status !== 'cancelled')
    .filter(t => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (catFilter !== 'all' && t.category !== catFilter) return false;
      return true;
    })
    .sort((a, b) => {
      if (a.status === 'live' && b.status !== 'live') return -1;
      if (b.status === 'live' && a.status !== 'live') return 1;
      if (a.status === 'upcoming' && b.status === 'upcoming') {
        try {
          const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
          const dateA = a.repeatDaily ? today : a.date;
          const dateB = b.repeatDaily ? today : b.date;
          const [hA, mA] = a.time.split(':').map(Number);
          const [hB, mB] = b.time.split(':').map(Number);
          const [yrA, moA, dyA] = dateA.split('-').map(Number);
          const [yrB, moB, dyB] = dateB.split('-').map(Number);
          const msA = new Date(yrA, moA - 1, dyA, hA, mA).getTime();
          const msB = new Date(yrB, moB - 1, dyB, hB, mB).getTime();
          return msA - msB;
        } catch { return 0; }
      }
      return 0;
    });

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  const ListHeader = () => (
    <>
      <AnnouncementCarousel />
      {recentWinners.length > 0 && <RecentWinnersSection winners={recentWinners} />}
    </>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPadding + 12 }]}>
        <View style={styles.logoRow}>
          <Image source={require('@/assets/images/icon.png')} style={styles.logoImg} />
          <View>
            <Text style={[styles.appTitle, { color: colors.primary }]}>fftournament</Text>
            <Text style={[styles.appSubtitle, { color: colors.mutedForeground }]}>TOURNAMENT HUB</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={() => router.push('/notifications' as never)}
            style={styles.bellBtn}
            activeOpacity={0.7}
          >
            <Feather name="bell" size={22} color={colors.foreground} />
            {unreadCount > 0 && (
              <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                <Text style={styles.badgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <View style={[styles.flameBadge, { backgroundColor: colors.live + '22', borderColor: colors.live + '55' }]}>
            <Feather name="zap" size={12} color={colors.live} />
            <Text style={[styles.flameBadgeText, { color: colors.live }]}>BOOYAH</Text>
          </View>
        </View>
      </View>

      <View style={[styles.filterRow, { borderBottomColor: colors.border }]}>
        <DropdownPicker
          label="STATUS"
          options={STATUS_OPTIONS}
          value={statusFilter}
          onChange={setStatusFilter}
          accentColor={colors.primary}
        />
        <View style={styles.filterDivider} />
        <DropdownPicker
          label="GAME MODE"
          options={CATEGORY_OPTIONS}
          value={catFilter}
          onChange={setCatFilter}
          accentColor={colors.accent}
        />
      </View>

      <FlatList
        data={visible}
        keyExtractor={t => t.id}
        ListHeaderComponent={ListHeader}
        renderItem={({ item }) => {
          const join = getJoinByTournamentId(item.id);
          const joinStatus: JoinStatus | null = join?.status ?? null;
          return (
            <TournamentCard tournament={item} joinStatus={joinStatus} />
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="inbox" size={48} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.mutedForeground }]}>No Tournaments</Text>
            <Text style={[styles.emptyText, { color: colors.border }]}>
              Check back later for upcoming tournaments
            </Text>
          </View>
        }
        contentContainerStyle={[styles.list, { paddingBottom: Platform.OS === 'web' ? 100 : insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 12,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoImg: { width: 36, height: 36, borderRadius: 8 },
  appTitle: { fontSize: 18, fontWeight: '700', letterSpacing: 1 },
  appSubtitle: { fontSize: 10, letterSpacing: 3, marginTop: -2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bellBtn: { position: 'relative', padding: 4 },
  badge: {
    position: 'absolute', top: 0, right: 0,
    minWidth: 16, height: 16, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
  },
  badgeText: { fontSize: 9, fontWeight: '800', color: '#000' },
  flameBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1,
  },
  flameBadgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  filterRow: {
    flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 12, gap: 10,
    borderBottomWidth: 1,
  },
  filterDivider: { width: 1 },
  list: { paddingHorizontal: 16, paddingTop: 10 },
  empty: { alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 40, paddingTop: 80 },
  emptyTitle: { fontSize: 16, fontWeight: '600' },
  emptyText: { fontSize: 13, textAlign: 'center', lineHeight: 18 },
});

const winnersStyles = StyleSheet.create({
  section: { paddingTop: 14, paddingBottom: 14, marginBottom: 4, borderBottomWidth: 1 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, marginBottom: 12,
  },
  trophy: { fontSize: 18 },
  sectionTitle: { fontSize: 16, fontWeight: '700', flex: 1 },
  countBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, borderWidth: 1 },
  countText: { fontSize: 11, fontWeight: '700' },
  scrollRow: { paddingHorizontal: 16, gap: 10 },
});

const winnerStyles = StyleSheet.create({
  card: {
    width: 150, borderRadius: 14, borderWidth: 1.5,
    padding: 14, gap: 4, alignItems: 'center',
  },
  rankBadge: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  rankEmoji: { fontSize: 22 },
  playerName: { fontSize: 13, fontWeight: '700', textAlign: 'center' },
  uid: { fontSize: 10, textAlign: 'center' },
  prize: { fontSize: 15, fontWeight: '800', textAlign: 'center' },
  tournamentName: { fontSize: 11, textAlign: 'center', marginTop: 2 },
  booyahBadge: {
    backgroundColor: '#FF6B00' + '22', borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 3, marginTop: 2,
  },
  booyahText: { fontSize: 9, fontWeight: '800', color: '#FF6B00' },
  date: { fontSize: 10, textAlign: 'center', marginTop: 1 },
});
