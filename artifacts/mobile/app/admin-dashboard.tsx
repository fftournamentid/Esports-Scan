import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Redirect, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
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
import { getAllUsersCount, subscribeAllRegistrations, subscribeWinnerPayments } from '@/services/adminService';
import { formatDateDisplay, formatTimeIST, parseISTDateTime } from '@/utils/time';

type StatusFilter = 'all' | 'upcoming' | 'live' | 'completed' | 'cancelled';

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

function getTournamentStartMs(t: Tournament): number {
  try {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const dateStr = t.repeatDaily ? today : t.date;
    if (!dateStr || !t.time) return Infinity;
    return parseISTDateTime(dateStr, t.time).getTime();
  } catch {
    return Infinity;
  }
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

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [totalPlayers, setTotalPlayers] = useState<number | null>(null);
  const [allRegistrations, setAllRegistrations] = useState<{ status: string }[]>([]);
  const [unpaidWinners, setUnpaidWinners] = useState(0);

  useEffect(() => {
    getAllUsersCount().then(setTotalPlayers);
  }, []);

  useEffect(() => {
    const unsub = subscribeAllRegistrations((regs) => {
      setAllRegistrations(regs.map(r => ({ status: r.status })));
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = subscribeWinnerPayments((ws) => {
      setUnpaidWinners(ws.filter(w => !w.paid).length);
    });
    return unsub;
  }, []);

  if (authLoading) return null;
  if (userProfile?.role !== 'admin') return <Redirect href="/" />;

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  const activeTournaments = tournaments.filter(t => t.status !== 'cancelled');
  const cancelledTournaments = [...tournaments].filter(t => t.status === 'cancelled').reverse();

  const filteredTournaments = useMemo(() => {
    let list: Tournament[];
    if (statusFilter === 'all') {
      list = [...activeTournaments];
    } else if (statusFilter === 'cancelled') {
      list = [...cancelledTournaments];
    } else if (statusFilter === 'completed') {
      list = activeTournaments.filter(t => t.status === 'completed' || t.status === 'closed');
    } else {
      list = activeTournaments.filter(t => t.status === statusFilter);
    }

    if (statusFilter === 'upcoming') {
      return list.sort((a, b) => getTournamentStartMs(a) - getTournamentStartMs(b));
    }
    return list.reverse();
  }, [statusFilter, activeTournaments, cancelledTournaments]);

  const pendingVerifications = allRegistrations.filter(r => r.status === 'pending').length;

  const playerStats = [
    { label: 'Players', value: totalPlayers !== null ? totalPlayers : '…', color: colors.primary, icon: 'users' as const },
    { label: 'Total Joins', value: allRegistrations.length, color: colors.accent, icon: 'activity' as const },
    { label: 'Pending Verif.', value: pendingVerifications, color: colors.live, icon: 'clock' as const },
    { label: 'Unpaid Winners', value: unpaidWinners, color: colors.destructive, icon: 'dollar-sign' as const },
  ];

  const tournamentStats = [
    { label: 'Total', value: activeTournaments.length, color: colors.foreground },
    { label: 'Published', value: activeTournaments.filter(t => t.published).length, color: colors.success },
    { label: 'Live', value: activeTournaments.filter(t => t.status === 'live').length, color: colors.live },
    { label: 'Cancelled', value: cancelledTournaments.length, color: colors.destructive },
  ];

  const menuItems = [
    {
      icon: 'check-square' as const,
      label: 'Payment Verification',
      sub: 'Review & approve player registrations',
      color: colors.success,
      badge: pendingVerifications > 0 ? pendingVerifications : 0,
      onPress: () => router.push('/admin/payment-verification'),
    },
    {
      icon: 'dollar-sign' as const,
      label: 'Winner Payments',
      sub: 'Track and mark prize payments',
      color: colors.gold,
      badge: unpaidWinners > 0 ? unpaidWinners : 0,
      onPress: () => router.push('/admin/winner-payments'),
    },
    {
      icon: 'users' as const,
      label: 'User Management',
      sub: 'View all players and their activity',
      color: colors.accent,
      badge: 0,
      onPress: () => router.push('/admin/user-management'),
    },
    {
      icon: 'credit-card' as const,
      label: 'Payment & QR / UPI Settings',
      sub: 'Update UPI ID, QR code, payment instructions',
      color: colors.primary,
      badge: 0,
      onPress: () => router.push('/admin/payment-settings'),
    },
    {
      icon: 'settings' as const,
      label: 'Admin Settings',
      sub: 'UPI, WhatsApp, email, Telegram, backup',
      color: colors.mutedForeground,
      badge: 0,
      onPress: () => router.push('/admin/app-settings'),
    },
  ];

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

  const handleLogout = async () => { await logOut(); };

  const STATUS_FILTER_OPTIONS: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'live', label: 'Live' },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  const TournamentCard = ({ t }: { t: Tournament }) => {
    const roomStatus = getRoomStatusLabel(t);
    const statusColor = roomStatus?.color === 'success' ? colors.success
      : roomStatus?.color === 'live' ? colors.live
      : colors.primary;

    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
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

        <View style={styles.cardMeta}>
          <Text style={[styles.cardMetaText, { color: colors.mutedForeground }]}>
            {t.category} · {t.repeatDaily ? 'Daily' : formatDateDisplay(t.date)} · {formatTimeIST(t.time)} IST
          </Text>
          <View style={styles.metaRight}>
            {roomStatus ? (
              <View style={[styles.chip, { backgroundColor: statusColor + '22', borderColor: statusColor + '44' }]}>
                <Feather name={roomStatus.color === 'success' ? 'unlock' : 'clock'} size={9} color={statusColor} />
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

  const showCancelledSection = statusFilter === 'all' || statusFilter === 'cancelled';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPadding + 8, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.primary }]}>ADMIN PANEL</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>First Booyah Tournament Manager</Text>
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
        {/* Player stats cards */}
        <View style={styles.playerStatsGrid}>
          {playerStats.map(s => (
            <View key={s.label} style={[styles.playerStatCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.playerStatIcon, { backgroundColor: s.color + '18' }]}>
                <Feather name={s.icon} size={16} color={s.color} />
              </View>
              <Text style={[styles.playerStatValue, { color: s.color }]}>{s.value}</Text>
              <Text style={[styles.playerStatLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Tournament stats row */}
        <View style={[styles.statsRow, { borderColor: colors.border }]}>
          {tournamentStats.map(s => (
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
              {item.badge > 0 && (
                <View style={[styles.menuBadge, { backgroundColor: item.color }]}>
                  <Text style={styles.menuBadgeText}>{item.badge}</Text>
                </View>
              )}
              <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Tournament section header + filter */}
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

        {/* Status filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterChips}>
          {STATUS_FILTER_OPTIONS.map(opt => {
            const isActive = statusFilter === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                onPress={() => setStatusFilter(opt.key)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isActive ? colors.primary : colors.muted,
                    borderColor: isActive ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text style={[styles.filterChipText, { color: isActive ? '#FFF' : colors.mutedForeground }]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Tournament list */}
        {statusFilter !== 'cancelled' && filteredTournaments.length === 0 && (statusFilter !== 'all' || cancelledTournaments.length === 0) ? (
          <View style={styles.empty}>
            <Feather name="inbox" size={44} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.mutedForeground }]}>
              {statusFilter === 'all' ? 'No tournaments yet' : `No ${statusFilter} tournaments`}
            </Text>
            <Text style={[styles.emptyHint, { color: colors.border }]}>
              {statusFilter === 'all' ? 'Tap ADD to get started' : 'Change filter to see others'}
            </Text>
          </View>
        ) : statusFilter !== 'cancelled' ? (
          filteredTournaments.map(t => <TournamentCard key={t.id} t={t} />)
        ) : null}

        {/* Cancelled section (shown in "all" or "cancelled" filter) */}
        {showCancelledSection && cancelledTournaments.length > 0 && (
          <>
            {statusFilter === 'all' && (
              <View style={[styles.cancelledSectionHeader, { borderTopColor: colors.border }]}>
                <View style={styles.cancelledTitleRow}>
                  <View style={[styles.cancelledDot, { backgroundColor: colors.destructive }]} />
                  <Text style={[styles.sectionTitle, { color: colors.destructive }]}>Cancelled Tournaments</Text>
                </View>
                <Text style={[styles.cancelledSub, { color: colors.mutedForeground }]}>Auto-deleted after 24 hours</Text>
              </View>
            )}

            {cancelledTournaments.map(t => (
              <View key={t.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.destructive + '44' }]}>
                <View style={[styles.cancelledStripe, { backgroundColor: colors.destructive }]} />

                <View style={styles.cancelledCardContent}>
                  <View style={styles.cancelledCardTop}>
                    <Text style={[styles.cardName, { color: colors.foreground }]} numberOfLines={1}>{t.name}</Text>
                    <View style={[styles.chip, { backgroundColor: colors.destructive + '22', borderColor: colors.destructive + '44' }]}>
                      <Feather name="slash" size={9} color={colors.destructive} />
                      <Text style={[styles.chipText, { color: colors.destructive }]}>CANCELLED</Text>
                    </View>
                  </View>

                  <Text style={[styles.cardMetaText, { color: colors.mutedForeground, paddingHorizontal: 0 }]}>
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

        {/* Show cancelled when filter is "cancelled" and no separate section was shown */}
        {statusFilter === 'cancelled' && cancelledTournaments.length === 0 && (
          <View style={styles.empty}>
            <Feather name="slash" size={44} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.mutedForeground }]}>No cancelled tournaments</Text>
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
    paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 16, fontWeight: '700', letterSpacing: 2 },
  headerSub: { fontSize: 11, marginTop: 2 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  logoutText: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  list: { paddingHorizontal: 16 },

  // Player stats grid
  playerStatsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14, marginBottom: 6,
  },
  playerStatCard: {
    flex: 1, minWidth: '44%', borderRadius: 12, borderWidth: 1,
    padding: 12, gap: 4, alignItems: 'center',
  },
  playerStatIcon: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  playerStatValue: { fontSize: 22, fontWeight: '800' },
  playerStatLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 0.3, textAlign: 'center' },

  // Tournament stats row
  statsRow: { flexDirection: 'row', borderRadius: 12, borderWidth: 1, marginBottom: 14, overflow: 'hidden' },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 10, gap: 2 },
  statValue: { fontSize: 20, fontWeight: '700' },
  statLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 0.5 },

  // Menu
  menuSection: { gap: 8, marginBottom: 16 },
  menuCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 12, borderWidth: 1, padding: 14 },
  menuIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  menuText: { flex: 1 },
  menuLabel: { fontSize: 14, fontWeight: '700' },
  menuSub: { fontSize: 11, marginTop: 2 },
  menuBadge: {
    minWidth: 22, height: 22, borderRadius: 11, alignItems: 'center',
    justifyContent: 'center', paddingHorizontal: 4, marginRight: 4,
  },
  menuBadgeText: { fontSize: 11, fontWeight: '800', color: '#FFF' },

  // Section header
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  createBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  createBtnText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },

  // Filter chips
  filterScroll: { marginBottom: 12 },
  filterChips: { flexDirection: 'row', gap: 8, paddingRight: 4 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  filterChipText: { fontSize: 12, fontWeight: '700' },

  // Empty
  empty: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyTitle: { fontSize: 15, fontWeight: '600' },
  emptyHint: { fontSize: 12 },

  // Tournament card
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
