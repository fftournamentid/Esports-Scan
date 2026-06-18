import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { AppNotification } from '@/types';
import { subscribeNotifications } from '@/services/firestoreNotificationService';
import { useColors } from '@/hooks/useColors';

const LAST_READ_KEY = 'ff_notif_last_read';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function getIcon(notif: AppNotification): React.ComponentProps<typeof Feather>['name'] {
  if (notif.targetType === 'specificTournament') return 'award';
  if (notif.title.toLowerCase().includes('room')) return 'key';
  if (notif.title.toLowerCase().includes('result')) return 'star';
  return 'bell';
}

export default function NotificationsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [notifs, setNotifs] = useState<AppNotification[]>([]);
  const [lastRead, setLastRead] = useState<string>('');

  useEffect(() => {
    AsyncStorage.getItem(LAST_READ_KEY).then((val) => setLastRead(val ?? ''));
    const now = new Date().toISOString();
    AsyncStorage.setItem(LAST_READ_KEY, now);
    const unsub = subscribeNotifications(setNotifs);
    return unsub;
  }, []);

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPadding + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Notifications</Text>
        <View style={styles.backBtn} />
      </View>

      <FlatList
        data={notifs}
        keyExtractor={(n) => n.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="bell-off" size={48} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.mutedForeground }]}>No Notifications</Text>
            <Text style={[styles.emptyText, { color: colors.border }]}>
              You'll see tournament updates and announcements here.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const isNew = lastRead ? new Date(item.createdAt) > new Date(lastRead) : false;
          return (
            <View style={[
              styles.card,
              {
                backgroundColor: isNew ? colors.primary + '10' : colors.card,
                borderColor: isNew ? colors.primary + '44' : colors.border,
              },
            ]}>
              <View style={[styles.iconWrap, { backgroundColor: colors.primary + '18' }]}>
                <Feather name={getIcon(item)} size={18} color={colors.primary} />
              </View>
              <View style={styles.content}>
                <View style={styles.titleRow}>
                  <Text style={[styles.notifTitle, { color: colors.foreground }]} numberOfLines={1}>
                    {item.title}
                  </Text>
                  {isNew && (
                    <View style={[styles.newDot, { backgroundColor: colors.primary }]} />
                  )}
                </View>
                <Text style={[styles.notifMsg, { color: colors.mutedForeground }]}>{item.message}</Text>
                <Text style={[styles.timeText, { color: colors.border }]}>{timeAgo(item.createdAt)}</Text>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: { width: 36 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  list: { padding: 16, gap: 10 },
  card: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    borderRadius: 14, borderWidth: 1, padding: 14,
  },
  iconWrap: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  content: { flex: 1, gap: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  notifTitle: { fontSize: 14, fontWeight: '700', flex: 1 },
  newDot: { width: 8, height: 8, borderRadius: 4 },
  notifMsg: { fontSize: 13, lineHeight: 18 },
  timeText: { fontSize: 11, marginTop: 2 },
  empty: { alignItems: 'center', gap: 10, paddingTop: 100, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '600' },
  emptyText: { fontSize: 13, textAlign: 'center', lineHeight: 18 },
});
