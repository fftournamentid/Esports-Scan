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

  // For daily tournaments, countdown to next occurrence
  const countdownDate = t.repeatDaily
    ? getNextDailyOccurrenceIST(t.time).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
    : t.date;

  const dateLabel = t.repeatDaily ? 'Daily' : formatDateDisplay(t.date);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => router.push(`/tournament/${t.id}` as never)}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={[styles.glow, { backgroundColor: colors.primary + '08' }]} />

      <View style={styles.header}>
        <View style={styles.leftBadges}>
          <View style={[styles.catBadge, { backgroundColor: catColor + '22', borderColor: catColor + '66' }]}>
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

      {/* Prize row: Entry Fee | Per Kill | Booyah */}
      <View style={styles.prizeRow}>
        <View style={styles.prizeItem}>
          <Text style={[styles.prizeLabel, { color: colors.mutedForeground }]}>ENTRY FEE</Text>
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
          </View>
        </View>
        {t.status === 'upcoming' && (
          <CountdownTimer targetDate={countdownDate} targetTime={t.time} />
        )}
      </View>

      {joined ? (
        <View style={[styles.joinedBanner, { backgroundColor: colors.success + '22' }]}>
          <Feather name="check-circle" size={12} color={colors.success} />
          <Text style={[styles.joinedText, { color: colors.success }]}>JOINED</Text>
        </View>
      ) : (
        t.status === 'upcoming' && !isFull && (
          <TouchableOpacity
            style={[styles.joinBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push(`/tournament/${t.id}` as never)}
            activeOpacity={0.8}
          >
            <Text style={[styles.joinBtnText, { color: colors.primaryForeground }]}>JOIN NOW</Text>
          </TouchableOpacity>
        )
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 12, overflow: 'hidden' },
  glow: { ...StyleSheet.absoluteFillObject, borderRadius: 14 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  leftBadges: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  catBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, borderWidth: 1 },
  catText: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  dailyBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4, borderWidth: 1 },
  dailyText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  name: { fontSize: 16, fontWeight: '700', marginBottom: 12, lineHeight: 22 },
  prizeRow: { flexDirection: 'row', marginBottom: 12, alignItems: 'center' },
  prizeItem: { flex: 1, alignItems: 'center' },
  prizeLabel: { fontSize: 9, fontWeight: '600', letterSpacing: 0.5, marginBottom: 2 },
  prizeValue: { fontSize: 14, fontWeight: '700' },
  divider: { width: 1, height: 30, marginHorizontal: 4 },
  footer: { borderTopWidth: 1, paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  footerLeft: { gap: 4, flex: 1 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeText: { fontSize: 11 },
  slotsRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  slotsText: { fontSize: 11, fontWeight: '600' },
  joinedBanner: { flexDirection: 'row', alignItems: 'center', gap: 4, justifyContent: 'center', padding: 6, borderRadius: 6, marginTop: 10 },
  joinedText: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  joinBtn: { padding: 10, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  joinBtnText: { fontSize: 13, fontWeight: '700', letterSpacing: 1.5 },
});
