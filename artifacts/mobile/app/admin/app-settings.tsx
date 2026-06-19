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
  const { paymentSettings, updatePaymentSettings, getBackupData } = useTournament();

  const [upiId, setUpiId] = useState(paymentSettings.upiId);
  const [whatsapp, setWhatsapp] = useState(paymentSettings.whatsappNumber);
  const [merchantName, setMerchantName] = useState(paymentSettings.merchantName ?? '');
  const [supportEmail, setSupportEmail] = useState(paymentSettings.supportEmail ?? '');
  const [telegramLink, setTelegramLink] = useState(paymentSettings.telegramLink ?? '');
  const [saving, setSaving] = useState(false);
  const [backing, setBacking] = useState(false);

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  const handleSave = async () => {
    if (!upiId.trim()) {
      Alert.alert('Error', 'UPI ID cannot be empty');
      return;
    }
    if (whatsapp && !/^\d{10,15}$/.test(whatsapp.trim())) {
      Alert.alert('Error', 'WhatsApp number should be 10–15 digits with country code, no +\n(e.g. 917488765248)');
      return;
    }
    if (supportEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supportEmail.trim())) {
      Alert.alert('Error', 'Please enter a valid support email address');
      return;
    }
    setSaving(true);
    try {
      await updatePaymentSettings({
        ...paymentSettings,
        upiId: upiId.trim().toLowerCase(),
        whatsappNumber: whatsapp.trim(),
        merchantName: merchantName.trim(),
        supportEmail: supportEmail.trim().toLowerCase(),
        telegramLink: telegramLink.trim(),
      });
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
        title: `FirstBooyah_Backup_${date}.json`,
        message: data,
      });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      Alert.alert('Error', 'Failed to export backup data.');
    } finally {
      setBacking(false);
    }
  };

  const Field = ({
    icon,
    title,
    hint,
    value,
    onChangeText,
    placeholder,
    keyboardType = 'default',
    autoCapitalize = 'none',
  }: {
    icon: React.ComponentProps<typeof Feather>['name'];
    title: string;
    hint: string;
    value: string;
    onChangeText: (v: string) => void;
    placeholder: string;
    keyboardType?: 'default' | 'email-address' | 'numeric' | 'url';
    autoCapitalize?: 'none' | 'sentences' | 'words';
  }) => (
    <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.sectionHeader}>
        <Feather name={icon} size={16} color={colors.primary} />
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
      </View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground + '66'}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        style={[styles.input, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground }]}
      />
      <Text style={[styles.hint, { color: colors.mutedForeground }]}>{hint}</Text>
    </View>
  );

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

        <Text style={[styles.groupLabel, { color: colors.mutedForeground }]}>PAYMENT</Text>

        <Field
          icon="credit-card"
          title="UPI ID"
          hint="Shown on payment screen and used to generate QR code for players"
          value={upiId}
          onChangeText={setUpiId}
          placeholder="fftournament@nyes"
          keyboardType="email-address"
        />

        <Field
          icon="user"
          title="Merchant / Business Name"
          hint="Displayed as the merchant name on the payment screen"
          value={merchantName}
          onChangeText={setMerchantName}
          placeholder="First Booyah"
          autoCapitalize="words"
        />

        <Text style={[styles.groupLabel, { color: colors.mutedForeground }]}>CONTACT & SUPPORT</Text>

        <Field
          icon="message-circle"
          title="WhatsApp Number"
          hint="Include country code without + (e.g. 917488765248 for India +91 7488765248)"
          value={whatsapp}
          onChangeText={setWhatsapp}
          placeholder="917488765248"
          keyboardType="numeric"
        />

        <Field
          icon="mail"
          title="Support Email"
          hint="Players can reach you via this email address"
          value={supportEmail}
          onChangeText={setSupportEmail}
          placeholder="support@firstbooyah.com"
          keyboardType="email-address"
        />

        <Field
          icon="send"
          title="Telegram Link"
          hint="Telegram channel or group link for player announcements"
          value={telegramLink}
          onChangeText={setTelegramLink}
          placeholder="https://t.me/firstbooyah"
          keyboardType="url"
        />

        <Text style={[styles.groupLabel, { color: colors.mutedForeground }]}>DATA</Text>

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
  content: { paddingHorizontal: 16, paddingBottom: 40, gap: 10 },
  groupLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginTop: 6, marginBottom: 2 },
  section: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 10 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 14, fontWeight: '700' },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 15 },
  hint: { fontSize: 11, lineHeight: 16 },
  backupBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderRadius: 10, padding: 14 },
  backupBtnText: { fontSize: 14, fontWeight: '700' },
  infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderWidth: 1, borderRadius: 10, padding: 12 },
  infoText: { fontSize: 12, flex: 1, lineHeight: 18 },
});
