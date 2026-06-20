import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { JoinedTournament, UserProfile } from '@/types';
import { subscribeAllUsers } from '@/services/adminService';
import { subscribeAllRegistrations } from '@/services/registrationService';
import { useColors } from '@/hooks/useColors';

const STATUS_COLORS: Record<string, string> = {
  pending: '#FF6B00',
  approved: '#30D158',
  rejected: '#FF3B30',
  room_released: '#4DA6FF',
  completed: '#FFD700',
};

const STATUS_LABELS: Record<string, string> = {
  pending: '⏳ Pending',
  approved: '✅ Approved',
  rejected: '❌ Rejected',
  room_released: '🔓 Room Released',
  completed: '✔ Completed',
};

function UserDetailModal({
  user,
  registrations,
  onClose,
  colors,
}: {
  user: UserProfile;
  registrations: JoinedTournament[];
  onClose: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === 'web' ? 20 : insets.top + 8;

  const fields = [
    { label: 'Player Name', value: user.name || '—', icon: 'user' as const },
    { label: 'Email', value: user.email || '—', icon: 'mail' as const },
    { label: 'Phone Number', value: user.phoneNumber || '—', icon: 'phone' as const },
    { label: 'Free Fire UID', value: user.freeFireUid || '—', icon: 'crosshair' as const },
    { label: 'UPI ID', value: user.upiId || '—', icon: 'credit-card' as const },
    { label: 'WhatsApp', value: user.whatsappNumber || '—', icon: 'message-circle' as const },
    { label: 'Role', value: user.role === 'admin' ? '⭐ Admin' : 'User', icon: 'shield' as const },
    { label: 'Joined App', value: user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }) : '—', icon: 'calendar' as const },
  ];

  const approved = registrations.filter(r => r.status === 'approved' || r.status === 'room_released' || r.status === 'completed').length;
  const pending = registrations.filter(r => r.status === 'pending').length;
  const rejected = registrations.filter(r => r.status === 'rejected').length;

  return (
    <Modal animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={[modalStyles.container, { backgroundColor: colors.background }]}>
        <View style={[modalStyles.header, { paddingTop: topPadding, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={modalStyles.backBtn}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[modalStyles.title, { color: colors.foreground }]}>PLAYER PROFILE</Text>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[modalStyles.content, { paddingBottom: Platform.OS === 'web' ? 40 : insets.bottom + 24 }]}
        >
          {/* Avatar */}
          <View style={[modalStyles.avatarCard, { backgroundColor: colors.card, borderColor: colors.primary + '44' }]}>
            <View style={[modalStyles.avatar, { backgroundColor: colors.primary + '22', borderColor: colors.primary + '55' }]}>
              <Text style={[modalStyles.avatarText, { color: colors.primary }]}>
                {(user.name || user.email || '?')[0].toUpperCase()}
              </Text>
            </View>
            <Text style={[modalStyles.playerName, { color: colors.foreground }]}>{user.name || '(No name)'}</Text>
            <Text style={[modalStyles.playerEmail, { color: colors.mutedForeground }]}>{user.email}</Text>
            {user.role === 'admin' && (
              <View style={[modalStyles.adminBadge, { backgroundColor: colors.gold + '22', borderColor: colors.gold + '55' }]}>
                <Feather name="shield" size={11} color={colors.gold} />
                <Text style={[modalStyles.adminBadgeText, { color: colors.gold }]}>ADMIN</Text>
              </View>
            )}
          </View>

          {/* Stats chips */}
          <View style={[modalStyles.statsRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={modalStyles.statItem}>
              <Text style={[modalStyles.statValue, { color: colors.primary }]}>{registrations.length}</Text>
              <Text style={[modalStyles.statLabel, { color: colors.mutedForeground }]}>Total Joins</Text>
            </View>
            <View style={[modalStyles.statDivider, { backgroundColor: colors.border }]} />
            <View style={modalStyles.statItem}>
              <Text style={[modalStyles.statValue, { color: colors.success }]}>{approved}</Text>
              <Text style={[modalStyles.statLabel, { color: colors.mutedForeground }]}>Approved</Text>
            </View>
            <View style={[modalStyles.statDivider, { backgroundColor: colors.border }]} />
            <View style={modalStyles.statItem}>
              <Text style={[modalStyles.statValue, { color: '#FF6B00' }]}>{pending}</Text>
              <Text style={[modalStyles.statLabel, { color: colors.mutedForeground }]}>Pending</Text>
            </View>
            <View style={[modalStyles.statDivider, { backgroundColor: colors.border }]} />
            <View style={modalStyles.statItem}>
              <Text style={[modalStyles.statValue, { color: colors.destructive }]}>{rejected}</Text>
              <Text style={[modalStyles.statLabel, { color: colors.mutedForeground }]}>Rejected</Text>
            </View>
          </View>

          {/* Profile fields */}
          <View style={[modalStyles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[modalStyles.sectionHeader, { borderBottomColor: colors.border }]}>
              <Feather name="user" size={14} color={colors.primary} />
              <Text style={[modalStyles.sectionTitle, { color: colors.foreground }]}>Profile Information</Text>
            </View>
            {fields.map((field, i) => (
              <View
                key={field.label}
                style={[modalStyles.fieldRow, { borderBottomColor: colors.border, borderBottomWidth: i < fields.length - 1 ? 1 : 0 }]}
              >
                <View style={modalStyles.fieldLeft}>
                  <Feather name={field.icon} size={13} color={colors.mutedForeground} />
                  <Text style={[modalStyles.fieldLabel, { color: colors.mutedForeground }]}>{field.label}</Text>
                </View>
                <Text
                  style={[modalStyles.fieldValue, {
                    color: field.value === '—' ? colors.mutedForeground : colors.foreground,
                    fontStyle: field.value === '—' ? 'italic' : 'normal',
                  }]}
                  selectable
                  numberOfLines={1}
                >
                  {field.value}
                </Text>
              </View>
            ))}
          </View>

          {/* Tournament History */}
          <View style={[modalStyles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[modalStyles.sectionHeader, { borderBottomColor: colors.border }]}>
              <Feather name="award" size={14} color={colors.primary} />
              <Text style={[modalStyles.sectionTitle, { color: colors.foreground }]}>Tournament History</Text>
              <View style={[modalStyles.countBadge, { backgroundColor: colors.primary + '22', borderColor: colors.primary + '44' }]}>
                <Text style={[modalStyles.countText, { color: colors.primary }]}>{registrations.length}</Text>
              </View>
            </View>

            {registrations.length === 0 ? (
              <View style={modalStyles.emptyHistory}>
                <Text style={[modalStyles.emptyHistoryText, { color: colors.mutedForeground }]}>No tournament history yet</Text>
              </View>
            ) : (
              [...registrations]
                .sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime())
                .map((reg, i) => {
                  const statusColor = STATUS_COLORS[reg.status] ?? colors.mutedForeground;
                  const statusLabel = STATUS_LABELS[reg.status] ?? reg.status;
                  return (
                    <View
                      key={reg.id}
                      style={[
                        modalStyles.historyRow,
                        {
                          borderBottomColor: colors.border,
                          borderBottomWidth: i < registrations.length - 1 ? 1 : 0,
                        },
                      ]}
                    >
                      <View style={modalStyles.historyLeft}>
                        <Text style={[modalStyles.historyTournament, { color: colors.foreground }]} numberOfLines={1}>
                          {reg.tournamentName}
                        </Text>
                        <Text style={[modalStyles.historyDate, { color: colors.mutedForeground }]}>
                          {new Date(reg.joinedAt).toLocaleDateString('en-IN', {
                            day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata',
                          })}
                        </Text>
                        {reg.transactionId ? (
                          <Text style={[modalStyles.historyTxn, { color: colors.border }]} numberOfLines={1}>
                            TXN: {reg.transactionId}
                          </Text>
                        ) : null}
                        {reg.rejectionReason ? (
                          <Text style={[modalStyles.historyRejReason, { color: colors.destructive }]} numberOfLines={1}>
                            Reason: {reg.rejectionReason}
                          </Text>
                        ) : null}
                      </View>
                      <View style={[modalStyles.statusChip, { backgroundColor: statusColor + '22', borderColor: statusColor + '44' }]}>
                        <Text style={[modalStyles.statusChipText, { color: statusColor }]}>{statusLabel}</Text>
                      </View>
                    </View>
                  );
                })
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function UserManagementScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [registrations, setRegistrations] = useState<JoinedTournament[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  useEffect(() => {
    const unsubUsers = subscribeAllUsers((u) => {
      setUsers(u);
      setLoading(false);
    });
    const unsubRegs = subscribeAllRegistrations(setRegistrations);
    return () => { unsubUsers(); unsubRegs(); };
  }, []);

  const regsByUser = useMemo(() => {
    const map: Record<string, JoinedTournament[]> = {};
    for (const r of registrations) {
      if (!map[r.userId]) map[r.userId] = [];
      map[r.userId].push(r);
    }
    return map;
  }, [registrations]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(u =>
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.freeFireUid?.toLowerCase().includes(q) ||
      u.phoneNumber?.toLowerCase().includes(q),
    );
  }, [users, search]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPadding + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>USER MANAGEMENT</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Summary */}
      <View style={[styles.statsRow, { marginHorizontal: 16, borderColor: colors.border }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: colors.primary }]}>{users.length}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>PLAYERS</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: colors.success }]}>{registrations.length}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>REGISTRATIONS</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: '#FF6B00' }]}>
            {registrations.filter(r => r.status === 'pending').length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>PENDING</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: colors.gold }]}>
            {users.filter(u => u.role === 'admin').length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>ADMINS</Text>
        </View>
      </View>

      {/* Search */}
      <View style={[styles.searchWrap, { marginHorizontal: 16, backgroundColor: colors.muted, borderColor: colors.border }]}>
        <Feather name="search" size={15} color={colors.mutedForeground} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name, email, FF UID, phone..."
          placeholderTextColor={colors.mutedForeground + '77'}
          style={[styles.searchInput, { color: colors.foreground }]}
          autoCapitalize="none"
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Feather name="x" size={15} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: Platform.OS === 'web' ? 40 : insets.bottom + 24 }]}
      >
        {loading ? (
          <View style={styles.center}>
            <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Loading players...</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name={search ? 'search' : 'users'} size={32} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              {search ? 'No players found' : 'No players yet'}
            </Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              {search ? `No results for "${search}"` : 'Players will appear here when they sign up.'}
            </Text>
          </View>
        ) : (
          filtered.map(u => {
            const userRegs = regsByUser[u.uid] ?? [];
            const approved = userRegs.filter(r => r.status === 'approved' || r.status === 'room_released' || r.status === 'completed').length;
            const pending = userRegs.filter(r => r.status === 'pending').length;
            const rejected = userRegs.filter(r => r.status === 'rejected').length;
            const isAdmin = u.role === 'admin';

            return (
              <TouchableOpacity
                key={u.uid}
                style={[styles.card, {
                  backgroundColor: colors.card,
                  borderColor: isAdmin ? colors.gold + '55' : colors.border,
                }]}
                onPress={() => setSelectedUser(u)}
                activeOpacity={0.85}
              >
                {isAdmin && <View style={[styles.adminStrip, { backgroundColor: colors.gold }]} />}

                <View style={styles.cardBody}>
                  <View style={styles.cardTop}>
                    <View style={styles.avatar}>
                      <Text style={[styles.avatarText, { color: colors.primary }]}>
                        {(u.name || u.email || '?')[0].toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.nameBlock}>
                      <View style={styles.nameRow}>
                        <Text style={[styles.userName, { color: colors.foreground }]} numberOfLines={1}>
                          {u.name || '(No name)'}
                        </Text>
                        {isAdmin && (
                          <View style={[styles.adminBadge, { backgroundColor: colors.gold + '22', borderColor: colors.gold + '55' }]}>
                            <Feather name="shield" size={9} color={colors.gold} />
                            <Text style={[styles.adminBadgeText, { color: colors.gold }]}>ADMIN</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.userEmail, { color: colors.mutedForeground }]} numberOfLines={1}>
                        {u.email}
                      </Text>
                      {u.freeFireUid ? (
                        <Text style={[styles.userUid, { color: colors.border }]} numberOfLines={1}>
                          FF UID: {u.freeFireUid}
                        </Text>
                      ) : null}
                    </View>
                    <View style={[styles.viewBtn, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '33' }]}>
                      <Feather name="eye" size={14} color={colors.primary} />
                    </View>
                  </View>

                  <View style={[styles.statsChips, { borderTopColor: colors.border }]}>
                    <View style={[styles.chip, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '33' }]}>
                      <Text style={[styles.chipNum, { color: colors.primary }]}>{userRegs.length}</Text>
                      <Text style={[styles.chipLabel, { color: colors.mutedForeground }]}>Joined</Text>
                    </View>
                    <View style={[styles.chip, { backgroundColor: colors.success + '15', borderColor: colors.success + '33' }]}>
                      <Text style={[styles.chipNum, { color: colors.success }]}>{approved}</Text>
                      <Text style={[styles.chipLabel, { color: colors.mutedForeground }]}>Approved</Text>
                    </View>
                    <View style={[styles.chip, { backgroundColor: '#FF6B00' + '15', borderColor: '#FF6B00' + '33' }]}>
                      <Text style={[styles.chipNum, { color: '#FF6B00' }]}>{pending}</Text>
                      <Text style={[styles.chipLabel, { color: colors.mutedForeground }]}>Pending</Text>
                    </View>
                    <View style={[styles.chip, { backgroundColor: colors.destructive + '15', borderColor: colors.destructive + '33' }]}>
                      <Text style={[styles.chipNum, { color: colors.destructive }]}>{rejected}</Text>
                      <Text style={[styles.chipLabel, { color: colors.mutedForeground }]}>Rejected</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          registrations={regsByUser[selectedUser.uid] ?? []}
          onClose={() => setSelectedUser(null)}
          colors={colors}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 8,
  },
  headerTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 1.5, flex: 1, textAlign: 'center' },
  backBtn: { padding: 8 },
  statsRow: {
    flexDirection: 'row', borderRadius: 12, borderWidth: 1, overflow: 'hidden',
    marginTop: 8, marginBottom: 10,
  },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  statNum: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 9, fontWeight: '600', letterSpacing: 0.3, marginTop: 2, textAlign: 'center' },
  statDivider: { width: 1 },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    marginBottom: 10,
  },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },
  content: { paddingHorizontal: 16, gap: 10 },
  center: { paddingVertical: 48, alignItems: 'center' },
  loadingText: { fontSize: 14 },
  empty: { borderRadius: 14, borderWidth: 1, padding: 32, alignItems: 'center', gap: 10 },
  emptyTitle: { fontSize: 15, fontWeight: '700' },
  emptySub: { fontSize: 12, textAlign: 'center', lineHeight: 18 },
  card: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  adminStrip: { height: 3, width: '100%' },
  cardBody: { padding: 14, gap: 10 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#4A9EFF22',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#4A9EFF44',
  },
  avatarText: { fontSize: 20, fontWeight: '800' },
  nameBlock: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  userName: { fontSize: 14, fontWeight: '700', flex: 1 },
  userEmail: { fontSize: 11, marginTop: 1 },
  userUid: { fontSize: 10, marginTop: 1 },
  adminBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5, borderWidth: 1,
  },
  adminBadgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  viewBtn: {
    width: 32, height: 32, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  statsChips: {
    flexDirection: 'row', gap: 6, paddingTop: 10, marginTop: 4, borderTopWidth: 1,
  },
  chip: { flex: 1, alignItems: 'center', paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  chipNum: { fontSize: 15, fontWeight: '800' },
  chipLabel: { fontSize: 9, marginTop: 2 },
});

const modalStyles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1,
  },
  title: { fontSize: 14, fontWeight: '700', letterSpacing: 1.5 },
  backBtn: { padding: 8 },
  content: { paddingHorizontal: 16, paddingTop: 14, gap: 12 },
  avatarCard: {
    borderRadius: 16, borderWidth: 1, padding: 20, alignItems: 'center', gap: 8,
  },
  avatar: {
    width: 72, height: 72, borderRadius: 36, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 32, fontWeight: '800' },
  playerName: { fontSize: 20, fontWeight: '700' },
  playerEmail: { fontSize: 13 },
  adminBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1,
  },
  adminBadgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  statsRow: {
    flexDirection: 'row', borderRadius: 12, borderWidth: 1, overflow: 'hidden',
  },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 9, fontWeight: '600', marginTop: 2, textAlign: 'center' },
  statDivider: { width: 1 },
  infoCard: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 12, borderBottomWidth: 1,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', flex: 1 },
  countBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, borderWidth: 1 },
  countText: { fontSize: 11, fontWeight: '700' },
  fieldRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 11,
  },
  fieldLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  fieldLabel: { fontSize: 12 },
  fieldValue: { fontSize: 13, fontWeight: '600', maxWidth: '55%', textAlign: 'right' },
  historyRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 10, gap: 10,
  },
  historyLeft: { flex: 1 },
  historyTournament: { fontSize: 13, fontWeight: '600' },
  historyDate: { fontSize: 11, marginTop: 2 },
  historyTxn: { fontSize: 10, marginTop: 1 },
  historyRejReason: { fontSize: 10, marginTop: 2, fontWeight: '600' },
  statusChip: {
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1,
  },
  statusChipText: { fontSize: 10, fontWeight: '700' },
  emptyHistory: { padding: 20, alignItems: 'center' },
  emptyHistoryText: { fontSize: 13 },
});
