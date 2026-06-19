import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Tournament } from '@/context/TournamentContext';
import { useColors } from '@/hooks/useColors';
import { formatDateDisplay, formatTimeIST, getNextDailyOccurrenceIST } from '@/utils/time';
import CountdownTimer from './CountdownTimer';
import StatusBadge from './StatusBadge';

const CATEGORY_COLORS: Record<string, string> = {
  Solo: '#FF6B00', Duo: '#4DA6FF', Squad: '#30D158', '1v1': '#FF3B30',
};

interface Props {
  tournament: Tournament;
  joined?: boolean;
}

export default function TournamentCard({ tournament: t, joined }: Props) {
  const colors = useColors();
  const router = useRouter();
  const catColor = CATEGORY_COLORS[t.category] ?? colors.primary;
  const slotsLeft = t.slots - t.slotsUsed;
  const isFull = slotsLeft <= 0;
  const isCompleted = t.status === 'completed' || t.status === 'closed';

  const countdownDate = t.repeatDaily
    ? getNextDailyOccurrenceIST(t.time).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
    : t.date;

  const dateLabel = t.repeatDaily ? 'Daily' : formatDateDisplay(t.date);
  const totalPrize = (t.booyahPrize ?? 0) + (t.perKillPrize ?? 0) * (t.slots ?? 0);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => router.push(`/tournament/${t.id}` as never)}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      {/* Category color top strip */}
      <View style={[styles.topStrip, { backgroundColor: catColor }]} />

      {/* Prize pool banner */}
      {totalPrize > 0 && (
        <View style={[styles.prizeBanner, { backgroundColor: catColor + '18' }]}>
          <Feather name="trending-up" size={10} color={catColor} />
          <Text style={[styles.prizeBannerText, { color: catColor }]}>
            PRIZE POOL UP TO ₹{totalPrize.toLocaleString('en-IN')}
          </Text>
        </View>
      )}

      <View style={styles.body}>
        <View style={styles.header}>
          <View style={styles.leftBadges}>
            <View style={[styles.catBadge, { backgroundColor: catColor + '22', borderColor: catColor + '55' }]}>
              <Text style={[styles.catText, { color: catColor }]}>{t.category}</Text>
            </View>
            {t.repeatDaily && (
              <View style={[styles.dailyBadge, { backgroundColor: colors.accent + '22', borderColor: colors.accent + '55' }]}>
                <Feather name="repeat" size={9} color={colors.accent} />
                <Text style={[styles.dailyText, { color: colors.accent }]}>DAILY</Text>
              </View>
            )}
          </View>
          <StatusBadge type="tournament" status={t.status} />
        </View>

        <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={2}>
          {t.name}
        </Text>

        {/* Prize row */}
        <View style={[styles.prizeRow, { borderColor: colors.border, backgroundColor: colors.muted + '55' }]}>
          <View style={styles.prizeItem}>
            <Text style={[styles.prizeLabel, { color: colors.mutedForeground }]}>ENTRY</Text>
            <Text style={[styles.prizeValue, { color: colors.primary }]}>₹{t.entryFee}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.prizeItem}>
            <Text style={[styles.prizeLabel, { color: colors.mutedForeground }]}>PER KILL</Text>
            <Text style={[styles.prizeValue, { color: colors.gold }]}>₹{t.perKillPrize ?? 0}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.prizeItem}>
            <Text style={[styles.prizeLabel, { color: colors.mutedForeground }]}>BOOYAH</Text>
            <Text style={[styles.prizeValue, { color: colors.success }]}>₹{t.booyahPrize ?? 0}</Text>
          </View>
        </View>

        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <View style={styles.footerLeft}>
            <View style={styles.timeRow}>
              <Feather name="calendar" size={11} color={colors.mutedForeground} />
              <Text style={[styles.timeText, { color: colors.mutedForeground }]}>
                {dateLabel} · {formatTimeIST(t.time)} IST
              </Text>
            </View>
            <View style={styles.slotsRow}>
              <Feather name="users" size={11} color={isFull ? colors.destructive : colors.success} />
              <Text style={[styles.slotsText, { color: isFull ? colors.destructive : colors.success }]}>
                {isFull ? 'FULL' : `${slotsLeft} slots left`}
              </Text>
              <Text style={[styles.slotsTotal, { color: colors.mutedForeground }]}>/ {t.slots}</Text>
            </View>
          </View>
          {t.status === 'upcoming' && (
            <CountdownTimer targetDate={countdownDate} targetTime={t.time} />
          )}
        </View>

        {/* Results button for completed */}
        {isCompleted && t.results && t.results.length > 0 && (
          <TouchableOpacity
            style={[styles.resultsBtn, { backgroundColor: colors.gold + '18', borderColor: colors.gold + '44' }]}
            onPress={() => router.push(`/results/${t.id}` as never)}
            activeOpacity={0.8}
          >
            <Feather name="award" size={13} color={colors.gold} />
            <Text style={[styles.resultsBtnText, { color: colors.gold }]}>VIEW RESULTS</Text>
          </TouchableOpacity>
        )}

        {joined ? (
          <View style={[styles.joinedBanner, { backgroundColor: colors.success + '22', borderColor: colors.success + '33' }]}>
            <Feather name="check-circle" size={12} color={colors.success} />
            <Text style={[styles.joinedText, { color: colors.success }]}>JOINED</Text>
          </View>
        ) : (
          t.status === 'upcoming' && !isFull && (
            <TouchableOpacity
              style={[styles.joinBtn, { backgroundColor: catColor }]}
              onPress={() => router.push(`/tournament/${t.id}` as never)}
              activeOpacity={0.8}
            >
              <Feather name="zap" size={13} color="#FFF" />
              <Text style={styles.joinBtnText}>JOIN NOW</Text>
            </TouchableOpacity>
          )
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, marginBottom: 14, overflow: 'hidden' },
  topStrip: { height: 4, width: '100%' },
  prizeBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  prizeBannerText: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  body: { padding: 14, gap: 0 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  leftBadges: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  catBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5, borderWidth: 1 },
  catText: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  dailyBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 5, borderWidth: 1 },
  dailyText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  name: { fontSize: 17, fontWeight: '800', marginBottom: 12, lineHeight: 23, letterSpacing: 0.2 },
  prizeRow: { flexDirection: 'row', marginBottom: 12, alignItems: 'center', borderRadius: 10, borderWidth: 1, overflow: 'hidden', paddingVertical: 2 },
  prizeItem: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  prizeLabel: { fontSize: 9, fontWeight: '600', letterSpacing: 0.5, marginBottom: 3 },
  prizeValue: { fontSize: 15, fontWeight: '800' },
  divider: { width: 1, height: 36 },
  footer: { borderTopWidth: 1, paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  footerLeft: { gap: 4, flex: 1 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeText: { fontSize: 11 },
  slotsRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  slotsText: { fontSize: 11, fontWeight: '700' },
  slotsTotal: { fontSize: 10 },
  resultsBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 9, borderRadius: 10, borderWidth: 1, marginTop: 2,
  },
  resultsBtnText: { fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  joinedBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 4, justifyContent: 'center',
    padding: 8, borderRadius: 10, borderWidth: 1, marginTop: 2,
  },
  joinedText: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  joinBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: 12, borderRadius: 10, marginTop: 2,
  },
  joinBtnText: { fontSize: 13, fontWeight: '800', letterSpacing: 1.5, color: '#FFF' },
});
