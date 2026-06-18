import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTournament } from '@/context/TournamentContext';
import { useColors } from '@/hooks/useColors';

export default function PaymentSettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { paymentSettings, updatePaymentSettings } = useTournament();

  const [upiId, setUpiId] = useState(paymentSettings.upiId);
  const [instructions, setInstructions] = useState<string[]>(paymentSettings.instructions);
  const [saving, setSaving] = useState(false);

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  const handleSave = async () => {
    if (!upiId.trim()) { Alert.alert('Error', 'UPI ID is required'); return; }
    setSaving(true);
    try {
      await updatePaymentSettings({
        ...paymentSettings,
        upiId: upiId.trim(),
        instructions: instructions.filter(i => i.trim()),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } finally {
      setSaving(false);
    }
  };

  const updateInstruction = (idx: number, val: string) => {
    setInstructions(prev => prev.map((v, i) => i === idx ? val : v));
  };

  const addInstruction = () => setInstructions(prev => [...prev, '']);
  const removeInstruction = (idx: number) => setInstructions(prev => prev.filter((_, i) => i !== idx));

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: topPadding + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>PAYMENT SETTINGS</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving} style={[styles.saveBtn, { backgroundColor: colors.primary }]}>
          <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>{saving ? '...' : 'SAVE'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>UPI ID</Text>
          <TextInput
            value={upiId}
            onChangeText={setUpiId}
            placeholder="yourname@upi"
            placeholderTextColor={colors.mutedForeground + '66'}
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
          />
          <Text style={[styles.hint, { color: colors.mutedForeground }]}>
            This UPI ID will be shown on the payment screen and used to generate QR code
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>PAYMENT INSTRUCTIONS</Text>
            <TouchableOpacity onPress={addInstruction} style={[styles.addBtn, { backgroundColor: colors.primary + '22', borderColor: colors.primary + '44' }]}>
              <Feather name="plus" size={14} color={colors.primary} />
            </TouchableOpacity>
          </View>
          {instructions.map((instr, i) => (
            <View key={i} style={styles.instrRow}>
              <View style={[styles.instrNumBadge, { backgroundColor: colors.primary + '22' }]}>
                <Text style={[styles.instrNum, { color: colors.primary }]}>{i + 1}</Text>
              </View>
              <TextInput
                value={instr}
                onChangeText={v => updateInstruction(i, v)}
                placeholder="Enter instruction..."
                placeholderTextColor={colors.mutedForeground + '66'}
                style={[styles.instrInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              />
              <TouchableOpacity onPress={() => removeInstruction(i)} style={styles.removeBtn}>
                <Feather name="x" size={14} color={colors.destructive} />
              </TouchableOpacity>
            </View>
          ))}
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
  content: { paddingHorizontal: 16, paddingBottom: 40, gap: 20 },
  section: { gap: 8 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 10, fontWeight: '600', letterSpacing: 1 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 15 },
  hint: { fontSize: 11, lineHeight: 16 },
  addBtn: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  instrRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  instrNumBadge: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  instrNum: { fontSize: 12, fontWeight: '700' },
  instrInput: { flex: 1, borderWidth: 1, borderRadius: 8, padding: 10, fontSize: 13 },
  removeBtn: { padding: 6 },
});
