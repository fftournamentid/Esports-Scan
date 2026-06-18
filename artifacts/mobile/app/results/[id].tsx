import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTournament } from '@/context/TournamentContext';
import { useColors } from '@/hooks/useColors';

const RANK_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];
const RANK_LABELS = ['1ST PLACE', '2ND PLACE', '3RD PLACE'];

export default function ResultsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getTournamentById } = useTournament();

  const t = getTournamentById(id ?? '');
  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  if (!t || !t.results?.length) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPadding + 8 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>RESULTS</Text>
          <View style={{ width: 38 }} />
        </View>
        <View style={styles.empty}>
          <Feather name="clock" size={48} color={colors.border} />
          <Text style={[styles.emptyTitle, { color: colors.mutedForeground }]}>Results Not Published</Text>
          <Text style={[styles.emptyText, { color: colors.border }]}>Check back after the tournament ends</Text>
        </View>
      </View>
    );
  }

  const top3 = t.results.slice(0, 3);
  const rest = t.results.slice(3);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPadding + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>RESULTS</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.gold + '44' }]}>
          <Text style={[styles.heroTitle, { color: colors.foreground }]}>{t.name}</Text>
          <Text style={[styles.heroSub, { color: colors.mutedForeground }]}>{t.date} · {t.time}</Text>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>TOP PLAYERS</Text>

        <View style={styles.podiumRow}>
          {top3.map((result, i) => {
            const rankColor = RANK_COLORS[i] ?? colors.mutedForeground;
            const size = i === 0 ? 90 : 72;
            return (
              <View
                key={i}
                style={[
                  styles.podiumItem,
                  { backgroundColor: colors.card, borderColor: result.booyahWinner ? '#FF6B00' + '77' : rankColor + '55' },
                  i === 0 && styles.podiumFirst,
                ]}
              >
                <View style={[styles.rankCircle, { backgroundColor: rankColor + '22', borderColor: rankColor, width: size, height: size, borderRadius: size / 2 }]}>
                  <Feather name="award" size={i === 0 ? 28 : 22} color={rankColor} />
                </View>
                <Text style={[styles.rankLabel, { color: rankColor }]}>{RANK_LABELS[i]}</Text>
                <Text style={[styles.playerName, { color: colors.foreground }]} numberOfLines={1}>{result.playerName}</Text>
                {result.uid ? (
                  <Text style={[styles.uidText, { color: colors.mutedForeground }]} numberOfLines={1}>
                    UID: {result.uid}
                  </Text>
                ) : null}
                <View style={[styles.prizeBadge, { backgroundColor: rankColor + '22' }]}>
                  <Text style={[styles.prizeText, { color: rankColor }]}>{result.prize}</Text>
                </View>
                {result.booyahWinner && (
                  <View style={styles.booyahBadge}>
                    <Text style={styles.booyahBadgeText}>🔥 BOOYAH WINNER</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {rest.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>OTHER WINNERS</Text>
            {rest.map((result, i) => (
              <View
                key={i}
                style={[
                  styles.restRow,
                  { backgroundColor: colors.card, borderColor: result.booyahWinner ? '#FF6B00' + '66' : colors.border },
                ]}
              >
                <View style={[styles.restRank, { backgroundColor: colors.muted }]}>
                  <Text style={[styles.restRankText, { color: colors.mutedForeground }]}>#{result.rank}</Text>
                </View>
                <View style={styles.restInfo}>
                  <Text style={[styles.restName, { color: colors.foreground }]} numberOfLines={1}>{result.playerName}</Text>
                  {result.uid ? (
                    <Text style={[styles.restUid, { color: colors.mutedForeground }]}>UID: {result.uid}</Text>
                  ) : null}
                </View>
                <View style={styles.restRight}>
                  {result.booyahWinner && (
                    <View style={styles.booyahBadgeSmall}>
                      <Text style={styles.booyahBadgeSmallText}>🔥 BOOYAH</Text>
                    </View>
                  )}
                  <Text style={[styles.restPrize, { color: colors.primary }]}>{result.prize}</Text>
                </View>
              </View>
            ))}
          </>
        )}

        <View style={{ height: 16 }} />
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
  headerTitle: { fontSize: 14, fontWeight: '700', letterSpacing: 2 },
  backBtn: { padding: 8 },
  content: { paddingHorizontal: 16, paddingBottom: 30 },
  heroCard: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 16, alignItems: 'center', gap: 4 },
  heroTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  heroSub: { fontSize: 12 },
  sectionTitle: { fontSize: 10, fontWeight: '600', letterSpacing: 2, marginBottom: 10 },
  podiumRow: { flexDirection: 'row', gap: 8, marginBottom: 20, alignItems: 'flex-end' },
  podiumItem: { flex: 1, borderRadius: 12, borderWidth: 1, padding: 10, alignItems: 'center', gap: 5 },
  podiumFirst: { paddingVertical: 14 },
  rankCircle: { alignItems: 'center', justifyContent: 'center', borderWidth: 2, marginBottom: 4 },
  rankLabel: { fontSize: 8, fontWeight: '700', letterSpacing: 1 },
  playerName: { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  uidText: { fontSize: 9, textAlign: 'center' },
  prizeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  prizeText: { fontSize: 11, fontWeight: '700' },
  booyahBadge: {
    backgroundColor: '#FF6B00' + '22', borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 3,
  },
  booyahBadgeText: { fontSize: 9, fontWeight: '800', color: '#FF6B00' },
  restRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 10, borderWidth: 1, padding: 12, marginBottom: 8 },
  restRank: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  restRankText: { fontSize: 12, fontWeight: '700' },
  restInfo: { flex: 1, gap: 2 },
  restName: { fontSize: 14, fontWeight: '600' },
  restUid: { fontSize: 11 },
  restRight: { alignItems: 'flex-end', gap: 4 },
  booyahBadgeSmall: { backgroundColor: '#FF6B00' + '22', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  booyahBadgeSmallText: { fontSize: 9, fontWeight: '800', color: '#FF6B00' },
  restPrize: { fontSize: 14, fontWeight: '700' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '600' },
  emptyText: { fontSize: 13, textAlign: 'center', lineHeight: 18 },
});
