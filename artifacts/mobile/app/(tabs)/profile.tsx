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
import { getProfileCompletion } from '@/utils/profileCompletion';

const APP_SHARE_URL = 'https://fftournament.replit.app';

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { firebaseUser, userProfile, logout } = useAuth();
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
              await logout();
            } catch {
              setLoggingOut(false);
            }
          },
        },
      ],
    );
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join fftournament — Play Free Fire tournaments and win real rewards!\n\n${APP_SHARE_URL}\n\nDownload now and start winning! 🎮🔥`,
        url: APP_SHARE_URL,
        title: 'fftournament',
      });
    } catch { }
  };

  const displayName = userProfile?.name || firebaseUser?.displayName || '';
  const email = userProfile?.email || firebaseUser?.email || '';
  const freeFireUid = userProfile?.freeFireUid || '';
  const phone = userProfile?.phoneNumber || '';
  const upiId = userProfile?.upiId || '';
  const whatsapp = userProfile?.whatsappNumber || '';
  const role = userProfile?.role || 'user';

  const completion = getProfileCompletion(userProfile);
  const barColor = completion.canJoin ? colors.success : colors.primary;
  const barWidth = `${completion.percentage}%` as `${number}%`;

  const infoRows = [
    { icon: 'user' as const, label: 'Name', value: displayName || '—' },
    { icon: 'mail' as const, label: 'Email', value: email || '—' },
    { icon: 'phone' as const, label: 'Phone', value: phone || '—' },
    { icon: 'crosshair' as const, label: 'Free Fire UID', value: freeFireUid || '—' },
    { icon: 'credit-card' as const, label: 'UPI ID', value: upiId || '—' },
    { icon: 'message-circle' as const, label: 'WhatsApp', value: whatsapp || '—' },
    { icon: 'shield' as const, label: 'Role', value: role.charAt(0).toUpperCase() + role.slice(1) },
  ];

  const avatarLetter = displayName ? displayName.charAt(0).toUpperCase() : (email ? email.charAt(0).toUpperCase() : '?');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPadding + 12 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>fftournament</Text>
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
              {avatarLetter}
            </Text>
          </View>
          <Text style={[styles.displayName, { color: colors.foreground }]}>
            {displayName || 'Complete your profile'}
          </Text>
          {role === 'admin' && (
            <View style={[styles.adminBadge, { backgroundColor: colors.primary + '22', borderColor: colors.primary + '55' }]}>
              <Feather name="shield" size={11} color={colors.primary} />
              <Text style={[styles.adminBadgeText, { color: colors.primary }]}>ADMIN</Text>
            </View>
          )}
        </View>

        {/* Profile Completion Card */}
        <View style={[styles.completionCard, {
          backgroundColor: colors.card,
          borderColor: completion.canJoin ? colors.success + '55' : colors.primary + '44',
        }]}>
          <View style={styles.completionHeader}>
            <View>
              <Text style={[styles.completionTitle, { color: colors.foreground }]}>Profile Completion</Text>
              <Text style={[styles.completionSub, { color: colors.mutedForeground }]}>
                {completion.completed} of {completion.total} fields completed
              </Text>
            </View>
            <Text style={[styles.completionPct, { color: barColor }]}>{completion.percentage}%</Text>
          </View>
          <View style={[styles.barBg, { backgroundColor: colors.muted }]}>
            <View style={[styles.barFill, { width: barWidth, backgroundColor: barColor }]} />
          </View>
          <Text style={[styles.completionStatus, { color: completion.canJoin ? colors.success : colors.destructive }]}>
            {completion.canJoin
              ? '✓ Tournament joining unlocked'
              : `Fill ${5 - completion.completed} more field${5 - completion.completed === 1 ? '' : 's'} to join tournaments`
            }
          </Text>
          {!completion.canJoin && (
            <View style={[styles.lockedBanner, { backgroundColor: colors.destructive + '15', borderColor: colors.destructive + '33' }]}>
              <Feather name="lock" size={13} color={colors.destructive} />
              <Text style={[styles.lockedText, { color: colors.destructive }]}>
                Tournament Joining Locked — Complete your profile first
              </Text>
            </View>
          )}
          <TouchableOpacity
            style={[styles.editProfileInline, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '33' }]}
            onPress={() => router.push('/edit-profile' as never)}
          >
            <Feather name="edit-2" size={13} color={colors.primary} />
            <Text style={[styles.editProfileInlineText, { color: colors.primary }]}>Complete Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Warning Box */}
        <View style={[styles.warningCard, { backgroundColor: '#FF6B00' + '12', borderColor: '#FF6B00' + '44' }]}>
          <View style={styles.warningHeader}>
            <Feather name="alert-triangle" size={16} color="#FF6B00" />
            <Text style={[styles.warningTitle, { color: '#FF6B00' }]}>⚠ Important — Prize Payment Info</Text>
          </View>
          <Text style={[styles.warningBody, { color: colors.mutedForeground }]}>
            Prize payments may fail if your profile information is incorrect or incomplete. Please verify the following before participating:
          </Text>
          <View style={styles.warningList}>
            {['Name', 'Phone Number', 'Free Fire UID', 'UPI ID'].map(field => (
              <View key={field} style={styles.warningListItem}>
                <View style={[styles.warningDot, { backgroundColor: '#FF6B00' }]} />
                <Text style={[styles.warningListText, { color: colors.foreground }]}>{field}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Info rows */}
        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {infoRows.map((row, i) => (
            <View
              key={row.label}
              style={[
                styles.infoRow,
                { borderBottomColor: colors.border, borderBottomWidth: i < infoRows.length - 1 ? 1 : 0 },
              ]}
            >
              <View style={styles.infoLeft}>
                <Feather name={row.icon} size={14} color={colors.primary} />
                <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{row.label}</Text>
              </View>
              <Text
                style={[styles.infoValue, {
                  color: row.value === '—' ? colors.mutedForeground : colors.foreground,
                  fontStyle: row.value === '—' ? 'italic' : 'normal',
                }]}
                numberOfLines={1}
              >
                {row.value}
              </Text>
            </View>
          ))}
        </View>

        {/* Edit Profile Button */}
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.primary + '55' }]}
          onPress={() => router.push('/edit-profile' as never)}
          activeOpacity={0.8}
        >
          <Feather name="edit-2" size={18} color={colors.primary} />
          <Text style={[styles.actionBtnText, { color: colors.primary }]}>Edit Profile</Text>
        </TouchableOpacity>

        {/* Share App */}
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.accent + '55' }]}
          onPress={handleShare}
          activeOpacity={0.8}
        >
          <Feather name="share-2" size={18} color={colors.accent} />
          <Text style={[styles.actionBtnText, { color: colors.accent }]}>Share fftournament</Text>
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.destructive + '44' }, loggingOut && { opacity: 0.6 }]}
          onPress={handleLogout}
          disabled={loggingOut}
          activeOpacity={0.8}
        >
          <Feather name="log-out" size={18} color={colors.destructive} />
          <Text style={[styles.actionBtnText, { color: colors.destructive }]}>
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
  title: { fontSize: 18, fontWeight: '700', letterSpacing: 1 },
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
  displayName: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
  adminBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1,
  },
  adminBadgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },

  completionCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  completionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  completionTitle: { fontSize: 15, fontWeight: '700' },
  completionSub: { fontSize: 12, marginTop: 2 },
  completionPct: { fontSize: 26, fontWeight: '800' },
  barBg: { height: 8, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  completionStatus: { fontSize: 12, fontWeight: '600' },
  lockedBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 10, borderRadius: 8, borderWidth: 1,
  },
  lockedText: { fontSize: 12, fontWeight: '600', flex: 1 },
  editProfileInline: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, alignSelf: 'flex-start',
  },
  editProfileInlineText: { fontSize: 13, fontWeight: '600' },

  warningCard: {
    borderRadius: 14, borderWidth: 1, padding: 14, gap: 8,
  },
  warningHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  warningTitle: { fontSize: 13, fontWeight: '700', flex: 1 },
  warningBody: { fontSize: 12, lineHeight: 18 },
  warningList: { gap: 5 },
  warningListItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  warningDot: { width: 6, height: 6, borderRadius: 3 },
  warningListText: { fontSize: 13, fontWeight: '600' },

  infoCard: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 13,
  },
  infoLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoLabel: { fontSize: 13 },
  infoValue: { fontSize: 13, fontWeight: '600', maxWidth: '55%', textAlign: 'right' },

  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 16, borderRadius: 14, borderWidth: 1,
  },
  actionBtnText: { fontSize: 15, fontWeight: '700' },
});
