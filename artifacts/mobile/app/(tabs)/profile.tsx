import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';
import { logOut } from '@/services/authService';

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { firebaseUser, userProfile } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            setLoggingOut(true);
            try {
              await logOut();
              router.replace('/auth/login' as never);
            } catch {
              setLoggingOut(false);
              Alert.alert('Error', 'Failed to log out. Please try again.');
            }
          },
        },
      ],
    );
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: 'Join FF Tournament App and play tournaments. Download now.',
      });
    } catch {
      // user dismissed share sheet — no action needed
    }
  };

  const displayName = userProfile?.name || firebaseUser?.displayName || 'Player';
  const email = userProfile?.email || firebaseUser?.email || '';
  const freeFireUid = userProfile?.freeFireUid || '';
  const role = userProfile?.role || 'user';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPadding + 12 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>PROFILE</Text>
        <Feather name="user" size={22} color={colors.primary} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Platform.OS === 'web' ? 100 : insets.bottom + 80 },
        ]}
      >
        {/* Avatar + name */}
        <View style={[styles.avatarCard, { backgroundColor: colors.card, borderColor: colors.primary + '44' }]}>
          <View style={[styles.avatarCircle, { backgroundColor: colors.primary + '22', borderColor: colors.primary + '66' }]}>
            <Text style={[styles.avatarInitial, { color: colors.primary }]}>
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={[styles.displayName, { color: colors.foreground }]}>{displayName}</Text>
          {role === 'admin' && (
            <View style={[styles.adminBadge, { backgroundColor: colors.primary + '22', borderColor: colors.primary + '55' }]}>
              <Feather name="shield" size={11} color={colors.primary} />
              <Text style={[styles.adminBadgeText, { color: colors.primary }]}>ADMIN</Text>
            </View>
          )}
        </View>

        {/* Info rows */}
        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {[
            { icon: 'user' as const, label: 'Name', value: displayName },
            { icon: 'mail' as const, label: 'Email', value: email || '—' },
            { icon: 'crosshair' as const, label: 'Free Fire UID', value: freeFireUid || '—' },
            { icon: 'shield' as const, label: 'Role', value: role.charAt(0).toUpperCase() + role.slice(1) },
          ].map((row, i, arr) => (
            <View
              key={row.label}
              style={[
                styles.infoRow,
                { borderBottomColor: colors.border, borderBottomWidth: i < arr.length - 1 ? 1 : 0 },
              ]}
            >
              <View style={styles.infoLeft}>
                <Feather name={row.icon} size={14} color={colors.primary} />
                <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{row.label}</Text>
              </View>
              <Text style={[styles.infoValue, { color: colors.foreground }]} numberOfLines={1}>
                {row.value}
              </Text>
            </View>
          ))}
        </View>

        {/* Edit Profile Button */}
        <TouchableOpacity
          style={[styles.editBtn, { backgroundColor: colors.card, borderColor: colors.primary + '55' }]}
          onPress={() => router.push('/edit-profile' as never)}
          activeOpacity={0.8}
        >
          <Feather name="edit-2" size={18} color={colors.primary} />
          <Text style={[styles.editBtnText, { color: colors.primary }]}>Edit Profile</Text>
        </TouchableOpacity>

        {/* Share App Button */}
        <TouchableOpacity
          style={[styles.shareBtn, { backgroundColor: colors.card, borderColor: colors.accent + '55' }]}
          onPress={handleShare}
          activeOpacity={0.8}
        >
          <Feather name="share-2" size={18} color={colors.accent} />
          <Text style={[styles.shareBtnText, { color: colors.accent }]}>Share App</Text>
        </TouchableOpacity>

        {/* Logout Button */}
        <TouchableOpacity
          style={[
            styles.logoutBtn,
            { backgroundColor: colors.destructive + '18', borderColor: colors.destructive + '44' },
            loggingOut && { opacity: 0.6 },
          ]}
          onPress={handleLogout}
          disabled={loggingOut}
          activeOpacity={0.8}
        >
          <Feather name="log-out" size={18} color={colors.destructive} />
          <Text style={[styles.logoutBtnText, { color: colors.destructive }]}>
            {loggingOut ? 'Logging out...' : 'Log Out'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
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
  scrollContent: { paddingHorizontal: 16, paddingTop: 8, gap: 12 },

  avatarCard: {
    borderRadius: 16, borderWidth: 1, padding: 24,
    alignItems: 'center', gap: 10,
  },
  avatarCircle: {
    width: 72, height: 72, borderRadius: 36, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { fontSize: 32, fontWeight: '800' },
  displayName: { fontSize: 20, fontWeight: '700' },
  adminBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1,
  },
  adminBadgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },

  infoCard: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 13,
  },
  infoLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoLabel: { fontSize: 13 },
  infoValue: { fontSize: 13, fontWeight: '600', maxWidth: '55%', textAlign: 'right' },

  editBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 16, borderRadius: 14, borderWidth: 1,
  },
  editBtnText: { fontSize: 15, fontWeight: '700' },

  shareBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 16, borderRadius: 14, borderWidth: 1,
  },
  shareBtnText: { fontSize: 15, fontWeight: '700' },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 16, borderRadius: 14, borderWidth: 1,
  },
  logoutBtnText: { fontSize: 15, fontWeight: '700' },
});
