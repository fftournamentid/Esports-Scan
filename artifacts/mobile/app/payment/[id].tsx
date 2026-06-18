import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTournament } from '@/context/TournamentContext';
import { useColors } from '@/hooks/useColors';

export default function PaymentScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { paymentSettings, getTournamentById } = useTournament();

  const t = getTournamentById(id ?? '');
  const [copied, setCopied] = useState(false);
  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  const upiLink = `upi://pay?pa=${encodeURIComponent(paymentSettings.upiId)}&pn=FreeFire%20Tournament&am=${t?.entryFee ?? 0}&tn=Tournament%20Entry`;

  const handleCopy = async () => {
    await Clipboard.setStringAsync(paymentSettings.upiId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPadding + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>PAYMENT</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {t && (
          <View style={[styles.tourneyInfo, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.tourneyName, { color: colors.foreground }]} numberOfLines={1}>{t.name}</Text>
            <Text style={[styles.feeText, { color: colors.primary }]}>Entry Fee: ₹{t.entryFee}</Text>
          </View>
        )}

        <View style={[styles.qrCard, { backgroundColor: colors.card, borderColor: colors.primary + '55' }]}>
          <Text style={[styles.qrTitle, { color: colors.mutedForeground }]}>SCAN & PAY</Text>
          <View style={[styles.qrWrapper, { backgroundColor: '#FFFFFF', borderColor: colors.primary }]}>
            <QRCode
              value={upiLink}
              size={180}
              color="#000000"
              backgroundColor="#FFFFFF"
            />
          </View>
          <Text style={[styles.upiNote, { color: colors.mutedForeground }]}>
            Works with PhonePe, GPay, Paytm & all UPI apps
          </Text>
        </View>

        <View style={[styles.upiCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.upiLabel, { color: colors.mutedForeground }]}>UPI ID</Text>
          <View style={styles.upiRow}>
            <Text style={[styles.upiId, { color: colors.primary }]}>{paymentSettings.upiId}</Text>
            <TouchableOpacity
              onPress={handleCopy}
              style={[styles.copyBtn, { backgroundColor: copied ? colors.success + '22' : colors.muted }]}
            >
              <Feather name={copied ? 'check' : 'copy'} size={14} color={copied ? colors.success : colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.instructionsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.instructionsTitle, { color: colors.foreground }]}>Instructions</Text>
          {paymentSettings.instructions.map((instr, i) => (
            <View key={i} style={styles.instrRow}>
              <View style={[styles.instrNum, { backgroundColor: colors.primary }]}>
                <Text style={[styles.instrNumText, { color: colors.primaryForeground }]}>{i + 1}</Text>
              </View>
              <Text style={[styles.instrText, { color: colors.foreground }]}>{instr}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: Platform.OS === 'web' ? 34 : insets.bottom + 8, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.nextBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push(`/join/${id}` as never)}
          activeOpacity={0.85}
        >
          <Text style={[styles.nextBtnText, { color: colors.primaryForeground }]}>
            I HAVE PAID — PROCEED
          </Text>
          <Feather name="arrow-right" size={18} color={colors.primaryForeground} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 8,
  },
  headerTitle: { fontSize: 14, fontWeight: '700', letterSpacing: 2 },
  backBtn: { padding: 8 },
  content: { paddingHorizontal: 16, paddingBottom: 20 },
  tourneyInfo: { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 12 },
  tourneyName: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  feeText: { fontSize: 14, fontWeight: '700' },
  qrCard: { borderRadius: 14, borderWidth: 1, padding: 20, alignItems: 'center', marginBottom: 12 },
  qrTitle: { fontSize: 11, fontWeight: '600', letterSpacing: 2, marginBottom: 16 },
  qrWrapper: { padding: 12, borderRadius: 12, borderWidth: 2, marginBottom: 12 },
  upiNote: { fontSize: 11, textAlign: 'center' },
  upiCard: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 12 },
  upiLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 1, marginBottom: 6 },
  upiRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  upiId: { fontSize: 16, fontWeight: '700', fontFamily: 'Inter_700Bold', flex: 1 },
  copyBtn: { padding: 8, borderRadius: 8 },
  instructionsCard: { borderRadius: 12, borderWidth: 1, padding: 14 },
  instructionsTitle: { fontSize: 14, fontWeight: '700', marginBottom: 12 },
  instrRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  instrNum: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  instrNumText: { fontSize: 12, fontWeight: '700' },
  instrText: { fontSize: 14, flex: 1, lineHeight: 20 },
  bottomBar: { padding: 16, borderTopWidth: 1 },
  nextBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 12 },
  nextBtnText: { fontSize: 14, fontWeight: '700', letterSpacing: 1 },
});
