import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';

const TAB_BAR_H = Platform.OS === 'ios' ? 82 : 64;

export default function SettingsTab() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { userProfile, logout } = useAuth();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out from your admin account?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: () => logout() },
      ],
    );
  };

  const groups: Array<{
    title: string;
    icon: React.ComponentProps<typeof Feather>['name'];
    color: string;
    items: Array<{
      icon: React.ComponentProps<typeof Feather>['name'];
      label: string;
      description: string;
      color: string;
      onPress: () => void;
    }>;
  }> = [
    {
      title: 'Payment',
      icon: 'credit-card',
      color: colors.gold,
      items: [
        {
          icon: 'credit-card',
          label: 'UPI & QR Settings',
          description: 'Set UPI ID, merchant name, QR code',
          color: colors.gold,
          onPress: () => router.push('/admin/payment-settings' as never),
        },
      ],
    },
    {
      title: 'Communication',
      icon: 'message-circle',
      color: '#25D366',
      items: [
        {
          icon: 'message-circle',
          label: 'WhatsApp Settings',
          description: 'Support number, tournament updates',
          color: '#25D366',
          onPress: () => router.push('/admin/app-settings' as never),
        },
        {
          icon: 'mail',
          label: 'Email Settings',
          description: 'Notification email, backup email',
          color: colors.accent,
          onPress: () => router.push('/admin/app-settings' as never),
        },
      ],
    },
    {
      title: 'Data & Backup',
      icon: 'database',
      color: colors.primary,
      items: [
        {
          icon: 'download',
          label: 'Backup & Export',
          description: 'Export user data, tournament records',
          color: colors.primary,
          onPress: () => router.push('/admin/app-settings' as never),
        },
      ],
    },
    {
      title: 'Notifications',
      icon: 'bell',
      color: colors.live,
      items: [
        {
          icon: 'bell',
          label: 'Notification Settings',
          description: 'Manage push notification preferences',
          color: colors.live,
          onPress: () => router.push('/notifications' as never),
        },
      ],
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Settings</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: TAB_BAR_H + (Platform.OS === 'web' ? 20 : insets.bottom) + 16 },
        ]}
      >
        {/* Admin Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.primary + '33' }]}>
          <View style={[styles.profileAvatar, { backgroundColor: colors.primary + '22' }]}>
            <Feather name="shield" size={24} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.profileName, { color: colors.foreground }]}>
              {userProfile?.name ?? 'Admin'}
            </Text>
            <Text style={[styles.profileEmail, { color: colors.mutedForeground }]}>
              {userProfile?.email ?? ''}
            </Text>
            <View style={[styles.roleBadge, { backgroundColor: colors.primary + '22', borderColor: colors.primary + '44' }]}>
              <Text style={[styles.roleText, { color: colors.primary }]}>ADMINISTRATOR</Text>
            </View>
          </View>
        </View>

        {/* Setting Groups */}
        {groups.map(group => (
          <View key={group.title}>
            <View style={styles.groupHeader}>
              <View style={[styles.groupIcon, { backgroundColor: group.color + '18' }]}>
                <Feather name={group.icon} size={14} color={group.color} />
              </View>
              <Text style={[styles.groupTitle, { color: group.color }]}>{group.title.toUpperCase()}</Text>
            </View>
            <View style={[styles.groupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {group.items.map((item, i) => (
                <TouchableOpacity
                  key={item.label}
                  style={[
                    styles.settingRow,
                    {
                      borderBottomColor: colors.border,
                      borderBottomWidth: i < group.items.length - 1 ? 1 : 0,
                    },
                  ]}
                  onPress={item.onPress}
                  activeOpacity={0.75}
                >
                  <View style={[styles.settingIcon, { backgroundColor: item.color + '18' }]}>
                    <Feather name={item.icon} size={17} color={item.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.settingLabel, { color: colors.foreground }]}>{item.label}</Text>
                    <Text style={[styles.settingDesc, { color: colors.mutedForeground }]}>{item.description}</Text>
                  </View>
                  <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* App Info */}
        <View style={[styles.appInfoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.appInfoRow}>
            <Text style={[styles.appInfoLabel, { color: colors.mutedForeground }]}>App</Text>
            <Text style={[styles.appInfoValue, { color: colors.foreground }]}>fftournament</Text>
          </View>
          <View style={[styles.appInfoDivider, { backgroundColor: colors.border }]} />
          <View style={styles.appInfoRow}>
            <Text style={[styles.appInfoLabel, { color: colors.mutedForeground }]}>Role</Text>
            <Text style={[styles.appInfoValue, { color: colors.primary }]}>Admin</Text>
          </View>
          <View style={[styles.appInfoDivider, { backgroundColor: colors.border }]} />
          <View style={styles.appInfoRow}>
            <Text style={[styles.appInfoLabel, { color: colors.mutedForeground }]}>Platform</Text>
            <Text style={[styles.appInfoValue, { color: colors.foreground }]}>{Platform.OS === 'ios' ? 'iOS' : Platform.OS === 'android' ? 'Android' : 'Web'}</Text>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={[styles.logoutBtn, { backgroundColor: colors.destructive, shadowColor: colors.destructive }]}
          onPress={handleLogout}
          activeOpacity={0.85}
        >
          <Feather name="log-out" size={20} color="#fff" />
          <Text style={styles.logoutText}>LOG OUT</Text>
        </TouchableOpacity>

        <Text style={[styles.logoutHint, { color: colors.mutedForeground }]}>
          You will be redirected to the login screen
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  scroll: { paddingHorizontal: 16, paddingTop: 16 },

  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 20,
  },
  profileAvatar: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
  },
  profileName: { fontSize: 17, fontWeight: '800', marginBottom: 3 },
  profileEmail: { fontSize: 12, marginBottom: 7 },
  roleBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  roleText: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },

  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8, marginTop: 4 },
  groupIcon: { width: 26, height: 26, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  groupTitle: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },

  groupCard: { borderRadius: 14, borderWidth: 1, overflow: 'hidden', marginBottom: 16 },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 14, paddingVertical: 14,
  },
  settingIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  settingLabel: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  settingDesc: { fontSize: 11, lineHeight: 16 },

  appInfoCard: { borderRadius: 14, borderWidth: 1, overflow: 'hidden', marginBottom: 20 },
  appInfoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  appInfoLabel: { fontSize: 13 },
  appInfoValue: { fontSize: 13, fontWeight: '700' },
  appInfoDivider: { height: 1 },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 17, borderRadius: 14,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  logoutText: { fontSize: 16, fontWeight: '900', color: '#fff', letterSpacing: 1.5 },
  logoutHint: { fontSize: 11, textAlign: 'center', marginTop: 8 },
});
