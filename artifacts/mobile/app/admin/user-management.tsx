import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
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

export default function UserManagementScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [registrations, setRegistrations] = useState<JoinedTournament[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

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
      u.freeFireUid?.toLowerCase().includes(q),
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
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>TOTAL PLAYERS</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: colors.success }]}>{registrations.length}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>TOTAL JOINS</Text>
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
          placeholder="Search by name, email, FF UID..."
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
            const isAdmin = u.role === 'admin';

            return (
              <View
                key={u.uid}
                style={[styles.card, {
                  backgroundColor: colors.card,
                  borderColor: isAdmin ? colors.gold + '55' : colors.border,
                }]}
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
                    </View>
                  </View>

                  <View style={styles.detailsGrid}>
                    {u.freeFireUid ? (
                      <View style={styles.detailRow}>
                        <Feather name="shield" size={12} color={colors.mutedForeground} />
                        <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>FF UID</Text>
                        <Text style={[styles.detailValue, { color: colors.foreground }]} selectable numberOfLines={1}>
                          {u.freeFireUid}
                        </Text>
                      </View>
                    ) : null}

                    {u.createdAt ? (
                      <View style={styles.detailRow}>
                        <Feather name="calendar" size={12} color={colors.mutedForeground} />
                        <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>Joined</Text>
                        <Text style={[styles.detailValue, { color: colors.mutedForeground }]}>
                          {new Date(u.createdAt).toLocaleDateString('en-IN', {
                            day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata',
                          })}
                        </Text>
                      </View>
                    ) : null}
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
                    <View style={[styles.chip, { backgroundColor: colors.gold + '15', borderColor: colors.gold + '33' }]}>
                      <Text style={[styles.chipNum, { color: colors.gold }]}>{pending}</Text>
                      <Text style={[styles.chipLabel, { color: colors.mutedForeground }]}>Pending</Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          })
        )}
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
  headerTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 1.5, flex: 1, textAlign: 'center' },
  backBtn: { padding: 8 },
  statsRow: {
    flexDirection: 'row', borderRadius: 12, borderWidth: 1, overflow: 'hidden',
    marginTop: 8, marginBottom: 10,
  },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  statNum: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 9, fontWeight: '600', letterSpacing: 0.5, marginTop: 2 },
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
  userName: { fontSize: 15, fontWeight: '700', flex: 1 },
  adminBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5, borderWidth: 1,
  },
  adminBadgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  userEmail: { fontSize: 12, marginTop: 2 },
  detailsGrid: { gap: 5 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailLabel: { fontSize: 11, minWidth: 55 },
  detailValue: { fontSize: 12, fontWeight: '500', flex: 1 },
  statsChips: {
    flexDirection: 'row', gap: 8, paddingTop: 10, marginTop: 4, borderTopWidth: 1,
  },
  chip: {
    flex: 1, alignItems: 'center', paddingVertical: 6, borderRadius: 8, borderWidth: 1,
  },
  chipNum: { fontSize: 16, fontWeight: '800' },
  chipLabel: { fontSize: 10, marginTop: 2 },
});
