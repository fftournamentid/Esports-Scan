import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import StatusBadge from '@/components/StatusBadge';
import { Tournament, useTournament } from '@/context/TournamentContext';
import { useColors } from '@/hooks/useColors';
import { formatDateDisplay, formatTimeIST } from '@/utils/time';

const TAB_BAR_H = Platform.OS === 'ios' ? 82 : 64;
const FILTERS = ['All', 'Live', 'Upcoming', 'Completed', 'Cancelled'] as const;
type Filter = (typeof FILTERS)[number];

const CATEGORY_COLORS: Record<string, string> = {
  Solo: '#FF6B00', Duo: '#4DA6FF', Squad: '#30D158', '1v1': '#FF3B30',
};

export default function TournamentsTab() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { tournaments, updateTournament, cancelTournament, deleteTournament } = useTournament();

  const [filter, setFilter] = useState<Filter>('All');
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const filtered = [...tournaments]
    .reverse()
    .filter(t => {
      if (filter === 'All') return true;
      if (filter === 'Live') return t.status === 'live';
      if (filter === 'Upcoming') return t.status === 'upcoming';
      if (filter === 'Completed') return t.status === 'completed' || t.status === 'closed';
      if (filter === 'Cancelled') return t.status === 'cancelled';
      return true;
    });

  const handleDelete = (t: Tournament) => {
    Alert.alert(
      'Delete Tournament',
      `Permanently delete "${t.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteTournament(t.id) },
      ],
    );
  };

  const handleCancel = (t: Tournament) => {
    Alert.alert(
      'Cancel Tournament',
      `Cancel "${t.name}"? It will be hidden from players.`,
      [
        { text: 'Back', style: 'cancel' },
        { text: 'Cancel Tournament', style: 'destructive', onPress: () => cancelTournament(t.id) },
      ],
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Tournaments</Text>
        <TouchableOpacity
          style={[styles.createBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/admin/create-tournament' as never)}
          activeOpacity={0.85}
        >
          <Feather name="plus" size={16} color="#000" />
          <Text style={styles.createBtnText}>CREATE</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.filters, { borderBottomColor: colors.border }]}
      >
        {FILTERS.map(f => {
          const count = tournaments.filter(t => {
            if (f === 'All') return true;
            if (f === 'Live') return t.status === 'live';
            if (f === 'Upcoming') return t.status === 'upcoming';
            if (f === 'Completed') return t.status === 'completed' || t.status === 'closed';
            if (f === 'Cancelled') return t.status === 'cancelled';
            return true;
          }).length;
          const active = f === filter;
          return (
            <TouchableOpacity
              key={f}
              style={[
                styles.filterPill,
                {
                  backgroundColor: active ? colors.primary : colors.card,
                  borderColor: active ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setFilter(f)}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterText, { color: active ? '#000' : colors.mutedForeground }]}>{f}</Text>
              <View style={[styles.filterBadge, { backgroundColor: active ? '#00000033' : colors.muted }]}>
                <Text style={[styles.filterBadgeText, { color: active ? '#000' : colors.mutedForeground }]}>{count}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: TAB_BAR_H + (Platform.OS === 'web' ? 20 : insets.bottom) + 16 },
        ]}
      >
        {filtered.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="inbox" size={36} color={colors.mutedForeground + '55'} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No {filter === 'All' ? '' : filter.toLowerCase()} tournaments
            </Text>
            {filter === 'All' && (
              <TouchableOpacity
                style={[styles.emptyCreateBtn, { backgroundColor: colors.primary }]}
                onPress={() => router.push('/admin/create-tournament' as never)}
              >
                <Feather name="plus" size={14} color="#000" />
                <Text style={styles.emptyCreateText}>Create First Tournament</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filtered.map(t => (
            <TournamentCard
              key={t.id}
              t={t}
              colors={colors}
              onManage={() => router.push({ pathname: '/admin/manage-tournament/[id]', params: { id: t.id } } as never)}
              onEdit={() => router.push({ pathname: '/admin/create-tournament', params: { id: t.id } } as never)}
              onRoom={() => router.push({ pathname: '/admin/room-settings/[id]', params: { id: t.id } } as never)}
              onResults={() => router.push({ pathname: '/admin/result-settings/[id]', params: { id: t.id } } as never)}
              onPublish={() => updateTournament(t.id, { published: !t.published })}
              onCancel={() => handleCancel(t)}
              onDelete={() => handleDelete(t)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

function TournamentCard({
  t, colors, onManage, onEdit, onRoom, onResults, onPublish, onCancel, onDelete,
}: {
  t: Tournament;
  colors: ReturnType<typeof useColors>;
  onManage: () => void;
  onEdit: () => void;
  onRoom: () => void;
  onResults: () => void;
  onPublish: () => void;
  onCancel: () => void;
  onDelete: () => void;
}) {
  const cc = CATEGORY_COLORS[t.category] ?? colors.primary;
  const isCancelled = t.status === 'cancelled';

  return (
    <View style={[cardStyles.card, { backgroundColor: colors.card, borderColor: colors.border, opacity: isCancelled ? 0.65 : 1 }]}>
      <View style={[cardStyles.strip, { backgroundColor: cc }]} />
      <View style={cardStyles.body}>
        {/* Top row */}
        <View style={cardStyles.topRow}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <View style={cardStyles.titleRow}>
              <View style={[cardStyles.catChip, { backgroundColor: cc + '22', borderColor: cc + '44' }]}>
                <Text style={[cardStyles.catText, { color: cc }]}>{t.category}</Text>
              </View>
              <Text style={[cardStyles.name, { color: colors.foreground }]} numberOfLines={1}>{t.name}</Text>
            </View>
            <Text style={[cardStyles.meta, { color: colors.mutedForeground }]}>
              {t.repeatDaily ? 'Daily' : formatDateDisplay(t.date)} · {formatTimeIST(t.time)} IST
            </Text>
          </View>
          <StatusBadge type="tournament" status={t.status} />
        </View>

        {/* Stats strip */}
        <View style={[cardStyles.statsRow, { borderTopColor: colors.border, borderBottomColor: colors.border }]}>
          {[
            { label: 'Entry', value: `₹${t.entryFee}`, color: colors.primary },
            { label: 'Prize', value: `₹${t.booyahPrize ?? 0}`, color: colors.gold },
            { label: 'Kill', value: `₹${t.perKillPrize ?? 0}`, color: colors.accent },
            { label: 'Slots', value: `${t.slotsUsed}/${t.slots}`, color: t.slotsUsed >= t.slots ? colors.destructive : colors.foreground },
          ].map((s, i, arr) => (
            <React.Fragment key={s.label}>
              <View style={cardStyles.stat}>
                <Text style={[cardStyles.statVal, { color: s.color }]}>{s.value}</Text>
                <Text style={[cardStyles.statLbl, { color: colors.mutedForeground }]}>{s.label}</Text>
              </View>
              {i < arr.length - 1 && <View style={[cardStyles.statDivider, { backgroundColor: colors.border }]} />}
            </React.Fragment>
          ))}
        </View>

        {/* Publish toggle */}
        {!isCancelled && (
          <View style={[cardStyles.publishRow, { borderBottomColor: colors.border }]}>
            <Feather name={t.published ? 'eye' : 'eye-off'} size={14} color={t.published ? colors.success : colors.mutedForeground} />
            <Text style={[cardStyles.publishLabel, { color: t.published ? colors.success : colors.mutedForeground }]}>
              {t.published ? 'Published — visible to players' : 'Draft — hidden from players'}
            </Text>
            <Switch
              value={t.published}
              onValueChange={onPublish}
              trackColor={{ false: colors.muted, true: colors.success + 'CC' }}
              thumbColor={t.published ? colors.success : colors.mutedForeground}
              style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
            />
          </View>
        )}

        {/* Actions */}
        {!isCancelled && (
          <View style={cardStyles.actions}>
            <ActionBtn icon="settings" label="Manage" color={colors.primary} onPress={onManage} />
            <ActionBtn icon="edit-2" label="Edit" color={colors.accent} onPress={onEdit} />
            <ActionBtn icon="unlock" label="Room" color={colors.foreground} onPress={onRoom} />
            <ActionBtn icon="award" label="Results" color={colors.gold} onPress={onResults} />
          </View>
        )}

        {/* Danger */}
        {!isCancelled && (
          <View style={cardStyles.dangerRow}>
            <TouchableOpacity
              style={[cardStyles.dangerBtn, { backgroundColor: colors.live + '15', borderColor: colors.live + '44' }]}
              onPress={onCancel}
            >
              <Feather name="slash" size={13} color={colors.live} />
              <Text style={[cardStyles.dangerText, { color: colors.live }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[cardStyles.dangerBtn, { backgroundColor: colors.destructive + '15', borderColor: colors.destructive + '44' }]}
              onPress={onDelete}
            >
              <Feather name="trash-2" size={13} color={colors.destructive} />
              <Text style={[cardStyles.dangerText, { color: colors.destructive }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
        {isCancelled && (
          <TouchableOpacity
            style={[cardStyles.fullDangerBtn, { backgroundColor: colors.destructive + '15', borderColor: colors.destructive + '44' }]}
            onPress={onDelete}
          >
            <Feather name="trash-2" size={13} color={colors.destructive} />
            <Text style={[cardStyles.dangerText, { color: colors.destructive }]}>Delete Permanently</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function ActionBtn({ icon, label, color, onPress }: { icon: React.ComponentProps<typeof Feather>['name']; label: string; color: string; onPress: () => void }) {
  const colors = useColors();
  return (
    <TouchableOpacity
      style={[actionStyles.btn, { backgroundColor: color + '15', borderColor: color + '44' }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Feather name={icon} size={14} color={color} />
      <Text style={[actionStyles.label, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}
const actionStyles = StyleSheet.create({
  btn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, paddingVertical: 9, borderRadius: 9, borderWidth: 1,
  },
  label: { fontSize: 11, fontWeight: '700' },
});

const cardStyles = StyleSheet.create({
  card: { borderRadius: 14, borderWidth: 1, overflow: 'hidden', marginBottom: 10 },
  strip: { height: 3 },
  body: { padding: 14 },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  catChip: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5, borderWidth: 1 },
  catText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  name: { fontSize: 15, fontWeight: '700', flex: 1 },
  meta: { fontSize: 11 },
  statsRow: {
    flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1,
    paddingVertical: 10, marginBottom: 10,
  },
  stat: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 13, fontWeight: '700' },
  statLbl: { fontSize: 9, fontWeight: '600', letterSpacing: 0.5, marginTop: 2 },
  statDivider: { width: 1 },
  publishRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingBottom: 10, marginBottom: 10, borderBottomWidth: 1,
  },
  publishLabel: { flex: 1, fontSize: 12 },
  actions: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  dangerRow: { flexDirection: 'row', gap: 8 },
  dangerBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, paddingVertical: 9, borderRadius: 9, borderWidth: 1,
  },
  fullDangerBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 9, borderWidth: 1,
  },
  dangerText: { fontSize: 12, fontWeight: '700' },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  createBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10,
  },
  createBtnText: { fontSize: 12, fontWeight: '800', color: '#000', letterSpacing: 0.5 },
  filters: { paddingHorizontal: 16, paddingVertical: 10, gap: 8, borderBottomWidth: 1 },
  filterPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1,
  },
  filterText: { fontSize: 13, fontWeight: '600' },
  filterBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 8 },
  filterBadgeText: { fontSize: 10, fontWeight: '700' },
  list: { paddingHorizontal: 16, paddingTop: 14 },
  emptyCard: {
    borderRadius: 14, borderWidth: 1, padding: 40,
    alignItems: 'center', gap: 12,
  },
  emptyText: { fontSize: 14, fontWeight: '600' },
  emptyCreateBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, marginTop: 4,
  },
  emptyCreateText: { fontSize: 14, fontWeight: '700', color: '#000' },
});
