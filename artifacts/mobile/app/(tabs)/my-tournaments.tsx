import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import StatusBadge from '@/components/StatusBadge';
import { JoinStatus, useTournament } from '@/context/TournamentContext';
import { useColors } from '@/hooks/useColors';
import { formatDateDisplay, formatTimeIST } from '@/utils/time';

const STATUS_SECTIONS: { status: JoinStatus | 'completed'; label: string; icon: 'clock' | 'check' | 'unlock' | 'award' | 'x-circle'; colorKey: 'primary' | 'success' | 'gold' | 'accent' | 'destructive' }[] = [
  { status: 'pending', label: 'Pending', icon: 'clock', colorKey: 'primary' },
  { status: 'approved', label: 'Approved', icon: 'check', colorKey: 'success' },
  { status: 'room_released', label: 'Room Released', icon: 'unlock', colorKey: 'accent' },
  { status: 'completed', label: 'Completed', icon: 'award', colorKey: 'gold' },
  { status: 'rejected', label: 'Rejected', icon: 'x-circle', colorKey: 'destructive' },
];

type TabValue = 'all' | JoinStatus;

export default function MyTournamentsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { joinedTournaments, getTournamentById } = useTournament();
  const [activeTab, setActiveTab] = useState<TabValue>('all');

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  const colorMap: Record<string, string> = {
    primary: colors.primary,
    success: colors.success,
    gold: colors.gold,
    accent: colors.accent,
    destructive: colors.destructive,
  };

  const filtered = activeTab === 'all'
    ? [...joinedTournaments].reverse()
    : [...joinedTournaments].filter(j => j.status === activeTab).reverse();

  const TAB_OPTIONS: { value: TabValue; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'room_released', label: 'Room' },
    { value: 'completed', label: 'Done' },
    { value: 'rejected', label: 'Rejected' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPadding + 12 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>MY TOURNAMENTS</Text>
        <Feather name="award" size={22} color={colors.primary} />
      </View>

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
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.list, { paddingBottom: Platform.OS === 'web' ? 100 : insets.bottom + 80 }]}
        >
          {filtered.map(item => {
            const t = getTournamentById(item.tournamentId);
            const section = STATUS_SECTIONS.find(s => s.status === item.status);
            const statusColor = section ? colorMap[section.colorKey] : colors.primary;

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
                    <Text style={[styles.statusHintText, { color: colors.primary }]}>
                      Waiting for admin approval
                    </Text>
                  </View>
                )}
                {item.status === 'approved' && (
                  <View style={[styles.statusHint, { backgroundColor: colors.success + '18' }]}>
                    <Feather name="check-circle" size={12} color={colors.success} />
                    <Text style={[styles.statusHintText, { color: colors.success }]}>
                      Approved — waiting for room info
                    </Text>
                  </View>
                )}
                {item.status === 'room_released' && (
                  <View style={[styles.statusHint, { backgroundColor: colors.accent + '18' }]}>
                    <Feather name="unlock" size={12} color={colors.accent} />
                    <Text style={[styles.statusHintText, { color: colors.accent }]}>
                      Room Released — Tap to View Room ID & Password
                    </Text>
                  </View>
                )}
                {item.status === 'completed' && t?.results?.length ? (
                  <View style={[styles.statusHint, { backgroundColor: colors.gold + '18' }]}>
                    <Feather name="award" size={12} color={colors.gold} />
                    <Text style={[styles.statusHintText, { color: colors.gold }]}>
                      Results Published — Tap to View
                    </Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
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
  tabScroll: { flexGrow: 0 },
  tabContent: { paddingHorizontal: 16, paddingBottom: 10, gap: 6 },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1,
  },
  tabText: { fontSize: 12, fontWeight: '600' },
  tabBadge: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  tabBadgeText: { fontSize: 10, fontWeight: '700' },
  list: { paddingHorizontal: 16, paddingTop: 4 },
  card: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 12 },
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
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '600' },
  emptyText: { fontSize: 13, textAlign: 'center', lineHeight: 18 },
});
