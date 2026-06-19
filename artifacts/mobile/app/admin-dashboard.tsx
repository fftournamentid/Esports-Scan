import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Redirect, useRouter } from 'expo-router';
import React from 'react';
import {
  Alert,
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
import { Tournament, useTournament } from '@/context/TournamentContext';
import { useColors } from '@/hooks/useColors';
import { logOut } from '@/services/authService';
import { formatDateDisplay, formatTimeIST, parseISTDateTime } from '@/utils/time';

function getRoomStatusLabel(t: Tournament): { label: string; color: string } | null {
  if (!t.roomId || !t.roomPassword) return null;
  if (t.roomReleaseTime) {
    try {
      const relTime = new Date(t.roomReleaseTime).toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata',
      });
      return { label: `Released ${relTime.toUpperCase()}`, color: 'success' };
    } catch {
      return { label: 'Released', color: 'success' };
    }
  }
  // Has room but not released yet — compute release time
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const matchDate = (t.repeatDaily ? today : t.date) || today;
  if (!t.time) return { label: 'Release Pending', color: 'live' };
  const releaseMs = parseISTDateTime(matchDate, t.time).getTime() - 30 * 60 * 1000;
  if (!isFinite(releaseMs) || Date.now() >= releaseMs) return { label: 'Release Pending', color: 'live' };
  try {
    const releaseTime = new Date(releaseMs).toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata',
    });
    return { label: `Auto-Release ${releaseTime.toUpperCase()}`, color: 'primary' };
  } catch {
    return { label: 'Auto-Release Scheduled', color: 'primary' };
  }
}

function getCancelledCountdown(cancelledAt: string): string {
  const elapsed = Date.now() - new Date(cancelledAt).getTime();
  const remaining = 24 * 60 * 60 * 1000 - elapsed;
  if (remaining <= 0) return 'Deleting...';
  const h = Math.floor(remaining / (60 * 60 * 1000));
  const m = Math.floor((remaining % (60 * 60 * 1000)) / 60000);
  return `Auto-deletes in ${h}h ${m}m`;
}

export default function AdminDashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { userProfile, authLoading } = useAuth();
  const {
    tournaments,
    deleteTournament,
    updateTournament,
    cancelTournament,
    restoreTournament,
  } = useTournament();

  if (authLoading) return null;

  if (userProfile?.role !== 'admin') {
    return <Redirect href="/" />;
  }

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  const activeTournaments = [...tournaments].filter(t => t.status !== 'cancelled').reverse();
  const cancelledTournaments = [...tournaments].filter(t => t.status === 'cancelled').reverse();

  const handleDelete = (t: Tournament) => {
    Alert.alert('Delete Tournament', `Permanently delete "${t.name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await deleteTournament(t.id);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  };

  const handleCancel = (t: Tournament) => {
    Alert.alert(
      'Cancel Tournament',
      `Cancel "${t.name}"?\n\nIt will be removed from the player view and auto-deleted after 24 hours. You can restore it before then.`,
      [
        { text: 'Back', style: 'cancel' },
        {
          text: 'Cancel Tournament',
          style: 'destructive',
          onPress: async () => {
            await cancelTournament(t.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          },
        },
      ]
    );
  };

  const handleRestore = async (t: Tournament) => {
    await restoreTournament(t.id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleTogglePublish = async (t: Tournament) => {
    await updateTournament(t.id, { published: !t.published });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleLogout = async () => {
    await logOut();
  };

  const stats = [
    { label: 'Total', value: activeTournaments.length, color: colors.foreground },
    { label: 'Published', value: activeTournaments.filter(t => t.published).length, color: colors.success },
    { label: 'Live', value: activeTournaments.filter(t => t.status === 'live').length, color: colors.live },
    { label: 'Cancelled', value: cancelledTournaments.length, color: colors.destructive },
  ];

  const menuItems = [
    {
      icon: 'check-square' as const,
      label: 'Payment Verification',
      sub: 'Review & approve player registrations by UTR/Transaction ID',
      color: colors.success,
      onPress: () => router.push('/admin/payment-verification'),
    },
    {
      icon: 'credit-card' as const,
      label: 'Payment & QR / UPI Settings',
      sub: 'Update UPI ID, QR code, payment instructions',
      color: colors.primary,
      onPress: () => router.push('/admin/payment-settings'),
    },
    {
      icon: 'settings' as const,
      label: 'Admin Settings',
      sub: 'UPI ID, WhatsApp number, admin password, backup',
      color: colors.accent,
      onPress: () => router.push('/admin/app-settings'),
    },
  ];

  const TournamentCard = ({ t }: { t: Tournament }) => {
    const roomStatus = getRoomStatusLabel(t);
    const statusColor = roomStatus?.color === 'success' ? colors.success
      : roomStatus?.color === 'live' ? colors.live
      : colors.primary;

    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {/* Card header */}
        <View style={styles.cardTop}>
          <View style={styles.cardNameRow}>
            <Text style={[styles.cardName, { color: colors.foreground }]} numberOfLines={1}>{t.name}</Text>
            {t.repeatDaily && (
              <View style={[styles.chip, { backgroundColor: colors.accent + '22', borderColor: colors.accent + '44' }]}>
                <Feather name="repeat" size={9} color={colors.accent} />
                <Text style={[styles.chipText, { color: colors.accent }]}>DAILY</Text>
              </View>
            )}
          </View>
          <StatusBadge type="tournament" status={t.status} />
        </View>

        {/* Meta */}
        <View style={styles.cardMeta}>
          <Text style={[styles.cardMetaText, { color: colors.mutedForeground }]}>
            {t.category} · {t.repeatDaily ? 'Daily' : formatDateDisplay(t.date)} · {formatTimeIST(t.time)} IST
          </Text>
          <View style={styles.metaRight}>
            {roomStatus ? (
              <View style={[styles.chip, { backgroundColor: statusColor + '22', borderColor: statusColor + '44' }]}>
                <Feather
                  name={roomStatus.color === 'success' ? 'unlock' : 'clock'}
                  size={9}
                  color={statusColor}
                />
                <Text style={[styles.chipText, { color: statusColor }]}>{roomStatus.label}</Text>
              </View>
            ) : (
              <View style={styles.publishRow}>
                <View style={[styles.publishDot, { backgroundColor: t.published ? colors.success : colors.border }]} />
                <Text style={[styles.publishText, { color: t.published ? colors.success : colors.mutedForeground }]}>
                  {t.published ? 'Published' : 'Draft'}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Prize breakdown */}
        <View style={[styles.feeRow, { borderColor: colors.border }]}>
          <View style={styles.feeItem}>
            <Text style={[styles.feeLabel, { color: colors.mutedForeground }]}>ENTRY</Text>
            <Text style={[styles.feeValue, { color: colors.primary }]}>₹{t.entryFee}</Text>
          </View>
          <View style={[styles.feeDivider, { backgroundColor: colors.border }]} />
          <View style={styles.feeItem}>
            <Text style={[styles.feeLabel, { color: colors.mutedForeground }]}>PER KILL</Text>
            <Text style={[styles.feeValue, { color: colors.gold }]}>₹{t.perKillPrize ?? 0}</Text>
          </View>
          <View style={[styles.feeDivider, { backgroundColor: colors.border }]} />
          <View style={styles.feeItem}>
            <Text style={[styles.feeLabel, { color: colors.mutedForeground }]}>BOOYAH</Text>
            <Text style={[styles.feeValue, { color: colors.success }]}>₹{t.booyahPrize ?? 0}</Text>
          </View>
          <View style={[styles.feeDivider, { backgroundColor: colors.border }]} />
          <View style={styles.feeItem}>
            <Text style={[styles.feeLabel, { color: colors.mutedForeground }]}>SLOTS</Text>
            <Text style={[styles.feeValue, { color: colors.foreground }]}>{t.slotsUsed}/{t.slots}</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={[styles.actions, { borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.action, { backgroundColor: colors.primary + '18' }]}
            onPress={() => router.push({ pathname: '/admin/create-tournament', params: { id: t.id } } as never)}
          >
            <Feather name="edit-2" size={13} color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.primary }]}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.action, { backgroundColor: colors.accent + '18' }]}
            onPress={() => router.push({ pathname: '/admin/room-settings/[id]', params: { id: t.id } } as never)}
          >
            <Feather name="unlock" size={13} color={colors.accent} />
            <Text style={[styles.actionText, { color: colors.accent }]}>Room</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.action, { backgroundColor: colors.gold + '18' }]}
            onPress={() => router.push({ pathname: '/admin/result-settings/[id]', params: { id: t.id } } as never)}
          >
            <Feather name="award" size={13} color={colors.gold} />
            <Text style={[styles.actionText, { color: colors.gold }]}>Results</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.action, { backgroundColor: (t.published ? colors.orange : colors.success) + '18' }]}
            onPress={() => handleTogglePublish(t)}
          >
            <Feather name={t.published ? 'eye-off' : 'eye'} size={13} color={t.published ? colors.orange : colors.success} />
            <Text style={[styles.actionText, { color: t.published ? colors.orange : colors.success }]}>
              {t.published ? 'Unpublish' : 'Publish'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.action, { backgroundColor: colors.live + '18' }]}
            onPress={() => handleCancel(t)}
          >
            <Feather name="slash" size={13} color={colors.live} />
            <Text style={[styles.actionText, { color: colors.live }]}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.action, { backgroundColor: colors.destructive + '18' }]}
            onPress={() => handleDelete(t)}
          >
            <Feather name="trash-2" size={13} color={colors.destructive} />
            <Text style={[styles.actionText, { color: colors.destructive }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding + 8, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.primary }]}>ADMIN PANEL</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>Free Fire Tournament Manager</Text>
        </View>
        <TouchableOpacity
          onPress={handleLogout}
          style={[styles.logoutBtn, { backgroundColor: colors.destructive + '22', borderColor: colors.destructive + '44' }]}
        >
          <Feather name="log-out" size={14} color={colors.destructive} />
          <Text style={[styles.logoutText, { color: colors.destructive }]}>LOGOUT</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.list, { paddingBottom: Platform.OS === 'web' ? 100 : insets.bottom + 20 }]}
      >
        {/* Stats */}
        <View style={[styles.statsRow, { borderColor: colors.border }]}>
          {stats.map(s => (
            <View key={s.label} style={styles.statItem}>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Quick menu */}
        <View style={styles.menuSection}>
          {menuItems.map(item => (
            <TouchableOpacity
              key={item.label}
              style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={item.onPress}
              activeOpacity={0.8}
            >
              <View style={[styles.menuIcon, { backgroundColor: item.color + '22' }]}>
                <Feather name={item.icon} size={18} color={item.color} />
              </View>
              <View style={styles.menuText}>
                <Text style={[styles.menuLabel, { color: colors.foreground }]}>{item.label}</Text>
                <Text style={[styles.menuSub, { color: colors.mutedForeground }]}>{item.sub}</Text>
              </View>
              <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Active Tournaments */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Tournaments</Text>
          <TouchableOpacity
            style={[styles.createBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/admin/create-tournament')}
          >
            <Feather name="plus" size={14} color={colors.primaryForeground} />
            <Text style={[styles.createBtnText, { color: colors.primaryForeground }]}>ADD</Text>
          </TouchableOpacity>
        </View>

        {activeTournaments.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="inbox" size={44} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.mutedForeground }]}>No tournaments yet</Text>
            <Text style={[styles.emptyHint, { color: colors.border }]}>Tap ADD to get started</Text>
          </View>
        ) : (
          activeTournaments.map(t => <TournamentCard key={t.id} t={t} />)
        )}

        {/* Cancelled Tournaments Section */}
        {cancelledTournaments.length > 0 && (
          <>
            <View style={[styles.cancelledSectionHeader, { borderTopColor: colors.border }]}>
              <View style={styles.cancelledTitleRow}>
                <View style={[styles.cancelledDot, { backgroundColor: colors.destructive }]} />
                <Text style={[styles.sectionTitle, { color: colors.destructive }]}>Cancelled Tournaments</Text>
              </View>
              <Text style={[styles.cancelledSub, { color: colors.mutedForeground }]}>Auto-deleted after 24 hours</Text>
            </View>

            {cancelledTournaments.map(t => (
              <View key={t.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.destructive + '44' }]}>
                {/* Red cancelled overlay stripe */}
                <View style={[styles.cancelledStripe, { backgroundColor: colors.destructive }]} />

                <View style={styles.cancelledCardContent}>
                  <View style={styles.cancelledCardTop}>
                    <Text style={[styles.cardName, { color: colors.foreground }]} numberOfLines={1}>{t.name}</Text>
                    <View style={[styles.chip, { backgroundColor: colors.destructive + '22', borderColor: colors.destructive + '44' }]}>
                      <Feather name="slash" size={9} color={colors.destructive} />
                      <Text style={[styles.chipText, { color: colors.destructive }]}>CANCELLED</Text>
                    </View>
                  </View>

                  <Text style={[styles.cardMetaText, { color: colors.mutedForeground }]}>
                    {t.category} · {t.repeatDaily ? 'Daily' : formatDateDisplay(t.date)} · {formatTimeIST(t.time)} IST
                  </Text>

                  {t.cancelledAt && (
                    <Text style={[styles.cancelCountdown, { color: colors.live }]}>
                      ⏱ {getCancelledCountdown(t.cancelledAt)}
                    </Text>
                  )}

                  <View style={[styles.cancelledActions, { borderTopColor: colors.border }]}>
                    <TouchableOpacity
                      style={[styles.action, { backgroundColor: colors.success + '18' }]}
                      onPress={() => handleRestore(t)}
                    >
                      <Feather name="rotate-ccw" size={13} color={colors.success} />
                      <Text style={[styles.actionText, { color: colors.success }]}>Restore</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.action, { backgroundColor: colors.destructive + '18' }]}
                      onPress={() => handleDelete(t)}
                    >
                      <Feather name="trash-2" size={13} color={colors.destructive} />
                      <Text style={[styles.actionText, { color: colors.destructive }]}>Delete Now</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 16, fontWeight: '700', letterSpacing: 2 },
  headerSub: { fontSize: 11, marginTop: 2 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  logoutText: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  list: { paddingHorizontal: 16 },
  statsRow: { flexDirection: 'row', borderRadius: 12, borderWidth: 1, marginTop: 14, marginBottom: 14, overflow: 'hidden' },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 12, gap: 2 },
  statValue: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 0.5 },
  menuSection: { gap: 8, marginBottom: 16 },
  menuCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 12, borderWidth: 1, padding: 14 },
  menuIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  menuText: { flex: 1 },
  menuLabel: { fontSize: 14, fontWeight: '700' },
  menuSub: { fontSize: 11, marginTop: 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  createBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  createBtnText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  empty: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyTitle: { fontSize: 15, fontWeight: '600' },
  emptyHint: { fontSize: 12 },
  card: { borderRadius: 14, borderWidth: 1, marginBottom: 12, overflow: 'hidden' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, paddingBottom: 6 },
  cardNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, marginRight: 8 },
  cardName: { fontSize: 14, fontWeight: '700', flex: 1 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4, borderWidth: 1 },
  chipText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  cardMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingBottom: 10 },
  cardMetaText: { fontSize: 11, flex: 1, paddingHorizontal: 12, paddingBottom: 4 },
  metaRight: { flexShrink: 0 },
  publishRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  publishDot: { width: 6, height: 6, borderRadius: 3 },
  publishText: { fontSize: 11, fontWeight: '600' },
  feeRow: { flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1 },
  feeItem: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  feeDivider: { width: 1 },
  feeLabel: { fontSize: 9, fontWeight: '600', letterSpacing: 0.5, marginBottom: 3 },
  feeValue: { fontSize: 13, fontWeight: '700' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, padding: 10, borderTopWidth: 1 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 6 },
  actionText: { fontSize: 11, fontWeight: '600' },
  // Cancelled section
  cancelledSectionHeader: { marginTop: 8, marginBottom: 10, paddingTop: 16, borderTopWidth: 1 },
  cancelledTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cancelledDot: { width: 8, height: 8, borderRadius: 4 },
  cancelledSub: { fontSize: 11, marginTop: 3, marginLeft: 16 },
  cancelledStripe: { height: 3, width: '100%' },
  cancelledCardContent: { padding: 12, gap: 4 },
  cancelledCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  cancelCountdown: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  cancelledActions: { flexDirection: 'row', gap: 8, paddingTop: 10, marginTop: 6, borderTopWidth: 1 },
});
