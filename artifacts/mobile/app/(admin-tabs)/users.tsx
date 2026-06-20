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
import { useColors } from '@/hooks/useColors';
import { subscribeAllUsers } from '@/services/adminService';
import type { UserProfile } from '@/types';

const TAB_BAR_H = Platform.OS === 'ios' ? 82 : 64;

export default function UsersTab() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  useEffect(() => {
    const unsub = subscribeAllUsers(
      (list) => setUsers(list.filter(u => u.role !== 'admin').sort((a, b) => a.name.localeCompare(b.name))),
    );
    return unsub;
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(u =>
      u.name.toLowerCase().includes(q) ||
      u.phoneNumber?.toLowerCase().includes(q) ||
      u.freeFireUid?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q),
    );
  }, [users, query]);

  const toggleExpand = (uid: string) => {
    setExpanded(prev => prev === uid ? null : uid);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>User Management</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>{users.length} players registered</Text>
        </View>
        <View style={[styles.countPill, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '33' }]}>
          <Text style={[styles.countText, { color: colors.primary }]}>{filtered.length}</Text>
        </View>
      </View>

      {/* Search */}
      <View style={[styles.searchWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="search" size={16} color={colors.mutedForeground} />
        <TextInput
          style={[styles.searchInput, { color: colors.foreground }]}
          placeholder="Search by name, phone, FF UID…"
          placeholderTextColor={colors.mutedForeground}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="while-editing"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Feather name="x" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: TAB_BAR_H + (Platform.OS === 'web' ? 20 : insets.bottom) + 16 },
        ]}
        keyboardDismissMode="on-drag"
      >
        {filtered.length === 0 && (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="users" size={36} color={colors.mutedForeground + '55'} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              {query ? 'No users match your search' : 'No users yet'}
            </Text>
          </View>
        )}

        {filtered.map(user => {
          const isOpen = expanded === user.uid;
          const initials = user.name
            ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
            : '??';

          return (
            <TouchableOpacity
              key={user.uid}
              style={[styles.userCard, { backgroundColor: colors.card, borderColor: isOpen ? colors.primary + '55' : colors.border }]}
              onPress={() => toggleExpand(user.uid)}
              activeOpacity={0.8}
            >
              <View style={styles.userTop}>
                {/* Avatar */}
                <View style={[styles.avatar, { backgroundColor: colors.primary + '22' }]}>
                  <Text style={[styles.avatarText, { color: colors.primary }]}>{initials}</Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[styles.userName, { color: colors.foreground }]}>{user.name || 'Unnamed Player'}</Text>
                  <View style={styles.userMetaRow}>
                    {user.phoneNumber ? (
                      <View style={styles.metaChip}>
                        <Feather name="phone" size={10} color={colors.mutedForeground} />
                        <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{user.phoneNumber}</Text>
                      </View>
                    ) : null}
                    {user.freeFireUid ? (
                      <View style={styles.metaChip}>
                        <Feather name="target" size={10} color={colors.accent} />
                        <Text style={[styles.metaText, { color: colors.accent }]}>{user.freeFireUid}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
                <Feather name={isOpen ? 'chevron-up' : 'chevron-down'} size={16} color={colors.mutedForeground} />
              </View>

              {isOpen && (
                <View style={[styles.expandedSection, { borderTopColor: colors.border }]}>
                  <DetailRow icon="mail" label="Email" value={user.email || '—'} colors={colors} />
                  <DetailRow icon="phone" label="Phone" value={user.phoneNumber || '—'} colors={colors} />
                  <DetailRow icon="message-circle" label="WhatsApp" value={user.whatsappNumber || '—'} colors={colors} />
                  <DetailRow icon="target" label="FF UID" value={user.freeFireUid || '—'} colors={colors} />
                  <DetailRow icon="credit-card" label="UPI ID" value={user.upiId || '—'} colors={colors} />
                  <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                    <View style={styles.detailLeft}>
                      <Feather name="calendar" size={13} color={colors.mutedForeground} />
                      <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>Joined</Text>
                    </View>
                    <Text style={[styles.detailValue, { color: colors.foreground }]}>
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                        : '—'}
                    </Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

function DetailRow({ icon, label, value, colors }: {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  value: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={[detailStyles.row, { borderBottomColor: colors.border }]}>
      <View style={detailStyles.left}>
        <Feather name={icon} size={13} color={colors.mutedForeground} />
        <Text style={[detailStyles.label, { color: colors.mutedForeground }]}>{label}</Text>
      </View>
      <Text style={[detailStyles.value, { color: colors.foreground }]} numberOfLines={1} selectable>{value}</Text>
    </View>
  );
}
const detailStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 9, borderBottomWidth: 1 },
  left: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { fontSize: 12, width: 70 },
  value: { fontSize: 13, fontWeight: '600', flex: 1, textAlign: 'right' },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  headerSub: { fontSize: 11, marginTop: 2 },
  countPill: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1,
  },
  countText: { fontSize: 16, fontWeight: '800' },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 16, marginVertical: 10,
    borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 11,
  },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },
  list: { paddingHorizontal: 16, paddingTop: 4 },
  emptyCard: { borderRadius: 14, borderWidth: 1, padding: 40, alignItems: 'center', gap: 12, marginTop: 8 },
  emptyText: { fontSize: 14, fontWeight: '600' },
  userCard: { borderRadius: 14, borderWidth: 1, marginBottom: 10, overflow: 'hidden' },
  userTop: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: '800' },
  userName: { fontSize: 14, fontWeight: '700', marginBottom: 5 },
  userMetaRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11 },
  expandedSection: { borderTopWidth: 1, paddingHorizontal: 14, paddingBottom: 8 },
  detailRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 9, borderBottomWidth: 1 },
  detailLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailLabel: { fontSize: 12, width: 70 },
  detailValue: { fontSize: 13, fontWeight: '600', flex: 1, textAlign: 'right' },
});
