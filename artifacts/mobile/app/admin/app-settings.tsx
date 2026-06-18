import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTournament } from '@/context/TournamentContext';
import { useColors } from '@/hooks/useColors';

export default function AppSettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { paymentSettings, updatePaymentSettings, setAdminPassword, getBackupData } = useTournament();

  const [upiId, setUpiId] = useState(paymentSettings.upiId);
  const [whatsapp, setWhatsapp] = useState(paymentSettings.whatsappNumber);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [backing, setBacking] = useState(false);

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  const handleSave = async () => {
    if (!upiId.trim()) {
      Alert.alert('Error', 'UPI ID cannot be empty');
      return;
    }
    if (whatsapp && !/^\d{10,15}$/.test(whatsapp)) {
      Alert.alert('Error', 'WhatsApp number should be 10–15 digits (with country code, no +)');
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (newPassword && newPassword.length < 4) {
      Alert.alert('Error', 'Password must be at least 4 characters');
      return;
    }
    setSaving(true);
    try {
      await updatePaymentSettings({
        ...paymentSettings,
        upiId: upiId.trim(),
        whatsappNumber: whatsapp,
      });
      if (newPassword) {
        await setAdminPassword(newPassword);
        setNewPassword('');
        setConfirmPassword('');
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Saved', 'Settings updated successfully.');
    } finally {
      setSaving(false);
    }
  };

  const handleBackup = async () => {
    setBacking(true);
    try {
      const data = getBackupData();
      const date = new Date().toISOString().split('T')[0];
      await Share.share({
        title: `FreeFire_Tournament_Backup_${date}.json`,
        message: data,
      });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      Alert.alert('Error', 'Failed to export backup data.');
    } finally {
      setBacking(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: topPadding + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>ADMIN SETTINGS</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving} style={[styles.saveBtn, { backgroundColor: colors.primary }]}>
          <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>{saving ? '...' : 'SAVE'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* UPI ID */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Feather name="credit-card" size={16} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>UPI ID</Text>
          </View>
          <TextInput
            value={upiId}
            onChangeText={setUpiId}
            placeholder="fftournament@nyes"
            placeholderTextColor={colors.mutedForeground + '66'}
            autoCapitalize="none"
            keyboardType="email-address"
            style={[styles.input, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground }]}
          />
          <Text style={[styles.hint, { color: colors.mutedForeground }]}>
            Shown on payment screen and used to generate QR code for players
          </Text>
        </View>

        {/* WhatsApp */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Feather name="message-circle" size={16} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>WhatsApp Number</Text>
          </View>
          <TextInput
            value={whatsapp}
            onChangeText={setWhatsapp}
            placeholder="917488765248"
            placeholderTextColor={colors.mutedForeground + '66'}
            keyboardType="numeric"
            style={[styles.input, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground }]}
          />
          <Text style={[styles.hint, { color: colors.mutedForeground }]}>
            Include country code without + (e.g. 917488765248 for India +91 7488765248)
          </Text>
        </View>

        {/* Admin Password */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Feather name="lock" size={16} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Change Admin Password</Text>
          </View>
          <Text style={[styles.hint, { color: colors.mutedForeground }]}>Leave blank to keep current password</Text>

          <View style={styles.passwordRow}>
            <TextInput
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="New password"
              placeholderTextColor={colors.mutedForeground + '66'}
              secureTextEntry={!showNew}
              style={[styles.inputFlex, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground }]}
            />
            <TouchableOpacity onPress={() => setShowNew(!showNew)} style={[styles.eyeBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <Feather name={showNew ? 'eye-off' : 'eye'} size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
          <View style={styles.passwordRow}>
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm new password"
              placeholderTextColor={colors.mutedForeground + '66'}
              secureTextEntry={!showConfirm}
              style={[styles.inputFlex, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground }]}
            />
            <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={[styles.eyeBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <Feather name={showConfirm ? 'eye-off' : 'eye'} size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Backup */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Feather name="download" size={16} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Backup Data</Text>
          </View>
          <Text style={[styles.hint, { color: colors.mutedForeground }]}>
            Export all tournaments, player registrations, and settings as a JSON file.
          </Text>
          <TouchableOpacity
            onPress={handleBackup}
            disabled={backing}
            style={[styles.backupBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
          >
            <Feather name="share" size={16} color={colors.primary} />
            <Text style={[styles.backupBtnText, { color: colors.primary }]}>
              {backing ? 'Exporting...' : 'Export & Share Backup'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.infoCard, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <Feather name="cloud" size={14} color={colors.mutedForeground} />
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
            All data is stored in the cloud via Firebase Firestore. Changes sync instantly across all devices.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 8,
  },
  headerTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 1.5, flex: 1, textAlign: 'center' },
  backBtn: { padding: 8 },
  saveBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  saveBtnText: { fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 40, gap: 14 },
  section: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 10 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 14, fontWeight: '700' },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 15 },
  inputFlex: { flex: 1, borderWidth: 1, borderTopLeftRadius: 10, borderBottomLeftRadius: 10, padding: 12, fontSize: 14 },
  hint: { fontSize: 11, lineHeight: 16 },
  passwordRow: { flexDirection: 'row' },
  eyeBtn: { borderWidth: 1, borderLeftWidth: 0, borderTopRightRadius: 10, borderBottomRightRadius: 10, padding: 12, alignItems: 'center', justifyContent: 'center' },
  backupBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderRadius: 10, padding: 14 },
  backupBtnText: { fontSize: 14, fontWeight: '700' },
  infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderWidth: 1, borderRadius: 10, padding: 12 },
  infoText: { fontSize: 12, flex: 1, lineHeight: 18 },
});
