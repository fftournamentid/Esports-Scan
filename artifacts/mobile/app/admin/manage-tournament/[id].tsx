import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
import { useTournament } from '@/context/TournamentContext';
import { useColors } from '@/hooks/useColors';
import { formatDateDisplay, formatTimeIST } from '@/utils/time';

export default function ManageTournamentScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getTournamentById, updateTournament, cancelTournament, deleteTournament } = useTournament();

  const [publishing, setPublishing] = useState(false);

  const t = getTournamentById(id ?? '');
  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  if (!t) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPadding + 8 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>MANAGE TOURNAMENT</Text>
          <View style={{ width: 38 }} />
        </View>
        <View style={styles.centered}>
          <Feather name="alert-circle" size={40} color={colors.destructive} />
          <Text style={[styles.notFoundText, { color: colors.foreground }]}>Tournament not found</Text>
        </View>
      </View>
    );
  }

  const CATEGORY_COLORS: Record<string, string> = {
    Solo: '#FF6B00', Duo: '#4DA6FF', Squad: '#30D158', '1v1': '#FF3B30',
  };
  const catColor = CATEGORY_COLORS[t.category] ?? colors.primary;
  const slotsLeft = t.slots - t.slotsUsed;

  const handleTogglePublish = async () => {
    setPublishing(true);
    try {
      await updateTournament(t.id, { published: !t.published });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } finally {
      setPublishing(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Tournament',
      `Cancel "${t.name}"?\n\nIt will be hidden from players and auto-deleted after 24 hours. You can restore it before then.`,
      [
        { text: 'Back', style: 'cancel' },
        {
          text: 'Cancel Tournament',
          style: 'destructive',
          onPress: async () => {
            await cancelTournament(t.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            router.back();
          },
        },
      ],
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Tournament',
      `Permanently delete "${t.name}"?\n\nThis action cannot be undone and all registration data will be lost.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            await deleteTournament(t.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.back();
          },
        },
      ],
    );
  };

  const actions = [
    {
      icon: 'edit-2' as const,
      label: 'Edit Tournament',
      description: 'Update name, date, time, slots, prize info, rules',
      color: colors.primary,
      onPress: () => router.push({ pathname: '/admin/create-tournament', params: { id: t.id } } as never),
    },
    {
      icon: 'unlock' as const,
      label: 'Room Details',
      description: 'Set room ID, password and release timing',
      color: colors.accent,
      onPress: () => router.push({ pathname: '/admin/room-settings/[id]', params: { id: t.id } } as never),
    },
    {
      icon: 'award' as const,
      label: 'Results & Winners',
      description: 'Publish results, add winners, manage leaderboard',
      color: colors.gold,
      onPress: () => router.push({ pathname: '/admin/result-settings/[id]', params: { id: t.id } } as never),
    },
    {
      icon: 'check-square' as const,
      label: 'Payment Verification',
      description: 'Approve or reject player registrations',
      color: colors.success,
      onPress: () => router.push('/admin/payment-verification' as never),
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPadding + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>MANAGE</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: Platform.OS === 'web' ? 40 : insets.bottom + 24 }]}
      >
        {/* Tournament Hero Card */}
        <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: catColor + '66' }]}>
          <View style={[styles.heroStrip, { backgroundColor: catColor }]} />
          <View style={styles.heroBody}>
            <View style={styles.heroTop}>
              <View style={[styles.catBadge, { backgroundColor: catColor + '22', borderColor: catColor + '55' }]}>
                <Text style={[styles.catText, { color: catColor }]}>{t.category}</Text>
              </View>
              <StatusBadge type="tournament" status={t.status} />
            </View>
            <Text style={[styles.heroName, { color: colors.foreground }]}>{t.name}</Text>
            <View style={styles.heroMeta}>
              <View style={styles.metaItem}>
                <Feather name="calendar" size={12} color={colors.mutedForeground} />
                <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                  {t.repeatDaily ? 'Daily' : formatDateDisplay(t.date)}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Feather name="clock" size={12} color={colors.mutedForeground} />
                <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{formatTimeIST(t.time)} IST</Text>
              </View>
            </View>

            {/* Stats Strip */}
            <View style={[styles.statsStrip, { borderTopColor: colors.border }]}>
              <View style={styles.statChip}>
                <Text style={[styles.statVal, { color: colors.primary }]}>₹{t.entryFee}</Text>
                <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>Entry</Text>
              </View>
              <View style={[styles.statDiv, { backgroundColor: colors.border }]} />
              <View style={styles.statChip}>
                <Text style={[styles.statVal, { color: colors.gold }]}>₹{t.perKillPrize ?? 0}</Text>
                <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>Per Kill</Text>
              </View>
              <View style={[styles.statDiv, { backgroundColor: colors.border }]} />
              <View style={styles.statChip}>
                <Text style={[styles.statVal, { color: colors.success }]}>₹{t.booyahPrize ?? 0}</Text>
                <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>Booyah</Text>
              </View>
              <View style={[styles.statDiv, { backgroundColor: colors.border }]} />
              <View style={styles.statChip}>
                <Text style={[styles.statVal, { color: slotsLeft === 0 ? colors.destructive : colors.foreground }]}>
                  {t.slotsUsed}/{t.slots}
                </Text>
                <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>Slots</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Publish Toggle */}
        <View style={[styles.publishCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.publishLeft}>
            <View style={[styles.publishIcon, { backgroundColor: t.published ? colors.success + '22' : colors.muted }]}>
              <Feather name={t.published ? 'eye' : 'eye-off'} size={18} color={t.published ? colors.success : colors.mutedForeground} />
            </View>
            <View>
              <Text style={[styles.publishTitle, { color: colors.foreground }]}>
                {t.published ? 'Published' : 'Draft (Hidden)'}
              </Text>
              <Text style={[styles.publishSub, { color: colors.mutedForeground }]}>
                {t.published
                  ? 'Visible to all players on the home screen'
                  : 'Only visible to admins — players cannot see this'}
              </Text>
            </View>
          </View>
          <Switch
            value={t.published}
            onValueChange={handleTogglePublish}
            disabled={publishing}
            trackColor={{ false: colors.muted, true: colors.success + 'CC' }}
            thumbColor={t.published ? colors.success : colors.mutedForeground}
          />
        </View>

        {/* Management Actions */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>ACTIONS</Text>
        {actions.map(action => (
          <TouchableOpacity
            key={action.label}
            style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={action.onPress}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIcon, { backgroundColor: action.color + '18' }]}>
              <Feather name={action.icon} size={20} color={action.color} />
            </View>
            <View style={styles.actionText}>
              <Text style={[styles.actionTitle, { color: colors.foreground }]}>{action.label}</Text>
              <Text style={[styles.actionDesc, { color: colors.mutedForeground }]}>{action.description}</Text>
            </View>
            <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        ))}

        {/* Danger Zone */}
        <Text style={[styles.sectionLabel, { color: colors.destructive, marginTop: 8 }]}>DANGER ZONE</Text>

        <TouchableOpacity
          style={[styles.dangerCard, { backgroundColor: colors.card, borderColor: colors.live + '55' }]}
          onPress={handleCancel}
          activeOpacity={0.8}
        >
          <View style={[styles.actionIcon, { backgroundColor: colors.live + '18' }]}>
            <Feather name="slash" size={20} color={colors.live} />
          </View>
          <View style={styles.actionText}>
            <Text style={[styles.actionTitle, { color: colors.live }]}>Cancel Tournament</Text>
            <Text style={[styles.actionDesc, { color: colors.mutedForeground }]}>
              Hide from players. Auto-deleted after 24 hours. Restorable.
            </Text>
          </View>
          <Feather name="chevron-right" size={18} color={colors.live} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.dangerCard, { backgroundColor: colors.card, borderColor: colors.destructive + '55' }]}
          onPress={handleDelete}
          activeOpacity={0.8}
        >
          <View style={[styles.actionIcon, { backgroundColor: colors.destructive + '18' }]}>
            <Feather name="trash-2" size={20} color={colors.destructive} />
          </View>
          <View style={styles.actionText}>
            <Text style={[styles.actionTitle, { color: colors.destructive }]}>Delete Permanently</Text>
            <Text style={[styles.actionDesc, { color: colors.mutedForeground }]}>
              Cannot be undone. All registration data will be lost.
            </Text>
          </View>
          <Feather name="chevron-right" size={18} color={colors.destructive} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 10, borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 14, fontWeight: '700', letterSpacing: 2, flex: 1, textAlign: 'center' },
  backBtn: { padding: 8 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  notFoundText: { fontSize: 16, fontWeight: '600' },

  content: { paddingHorizontal: 16, paddingTop: 14, gap: 10 },

  heroCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  heroStrip: { height: 4 },
  heroBody: { padding: 16 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  catBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5, borderWidth: 1 },
  catText: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  heroName: { fontSize: 20, fontWeight: '800', marginBottom: 8, lineHeight: 26 },
  heroMeta: { flexDirection: 'row', gap: 16, marginBottom: 14 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: 12 },

  statsStrip: {
    flexDirection: 'row', borderTopWidth: 1, paddingTop: 12, marginTop: 4,
  },
  statChip: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 16, fontWeight: '800' },
  statLbl: { fontSize: 9, fontWeight: '600', letterSpacing: 0.5, marginTop: 2 },
  statDiv: { width: 1, height: 36, alignSelf: 'center' },

  publishCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: 14, borderWidth: 1, padding: 14, gap: 12,
  },
  publishLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  publishIcon: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  publishTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  publishSub: { fontSize: 12, lineHeight: 16 },

  sectionLabel: {
    fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginTop: 4,
  },
  actionCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 14, borderWidth: 1, padding: 14,
  },
  actionIcon: {
    width: 48, height: 48, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  actionText: { flex: 1 },
  actionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 3 },
  actionDesc: { fontSize: 12, lineHeight: 17 },
  dangerCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 14, borderWidth: 1, padding: 14,
  },
});
