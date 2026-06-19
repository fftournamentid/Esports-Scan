import { Feather } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTournament } from '@/context/TournamentContext';
import { useColors } from '@/hooks/useColors';

export default function JoinFormScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getTournamentById, paymentSettings } = useTournament();

  const t = getTournamentById(id ?? '');
  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  const openWhatsApp = () => {
    const msg = [
      `*Free Fire Tournament Registration*`,
      ``,
      `Tournament: ${t?.name ?? ''}`,
      `Date: ${t?.date ?? ''} at ${t?.time ?? ''}`,
      ``,
      `Player Name: [Your Name]`,
      `Free Fire UID: [Your UID]`,
      `UTR Number: [UTR / Transaction ID]`,
      `Payment Screenshot: [Attach screenshot]`,
      ``,
      `Please verify and approve my entry. Thank you!`,
    ].join('\n');

    Linking.openURL(`https://wa.me/${paymentSettings.whatsappNumber}?text=${encodeURIComponent(msg)}`);
  };

  if (!t) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPadding + 8 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>JOIN TOURNAMENT</Text>
          <View style={{ width: 38 }} />
        </View>
        <View style={styles.notFound}>
          <Feather name="alert-circle" size={40} color={colors.destructive} />
          <Text style={[styles.notFoundText, { color: colors.foreground }]}>Tournament not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPadding + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>JOIN TOURNAMENT</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: Platform.OS === 'web' ? 40 : insets.bottom + 24 }]}
      >
        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.primary + '44' }]}>
          <Text style={[styles.tourneyName, { color: colors.foreground }]}>{t.name}</Text>
          <View style={styles.infoRow}>
            <Text style={[styles.infoText, { color: colors.mutedForeground }]}>{t.date} · {t.time}</Text>
            <Text style={[styles.feeText, { color: colors.primary }]}>₹{t.entryFee}</Text>
          </View>
        </View>

        <View style={[styles.instructionBox, { backgroundColor: '#0A2E1A', borderColor: '#25D366' + '66' }]}>
          <View style={styles.instructionHeader}>
            <Feather name="message-circle" size={18} color="#25D366" />
            <Text style={[styles.instructionTitle, { color: '#25D366' }]}>How to Join</Text>
          </View>
          <Text style={[styles.instructionSubtitle, { color: '#CCCCCC' }]}>
            To join this tournament, send the following details on WhatsApp:
          </Text>
          <View style={styles.detailsList}>
            {[
              'Player Name',
              'Free Fire UID',
              'Tournament Name',
              'UTR Number (if payment required)',
              'Payment Screenshot',
            ].map((item, i) => (
              <View key={i} style={styles.detailItem}>
                <View style={[styles.bullet, { backgroundColor: '#25D366' }]} />
                <Text style={[styles.detailText, { color: '#EEEEEE' }]}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={styles.waButton}
          onPress={openWhatsApp}
          activeOpacity={0.85}
        >
          <Feather name="message-circle" size={22} color="#FFFFFF" />
          <Text style={styles.waButtonText}>JOIN ON WHATSAPP</Text>
        </TouchableOpacity>
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
  headerTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 2 },
  backBtn: { padding: 8 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  notFoundText: { fontSize: 16, fontWeight: '600' },
  content: { paddingHorizontal: 16, paddingTop: 8, gap: 16 },
  infoCard: { borderRadius: 12, borderWidth: 1, padding: 14 },
  tourneyName: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between' },
  infoText: { fontSize: 12 },
  feeText: { fontSize: 13, fontWeight: '700' },
  instructionBox: {
    borderRadius: 14, borderWidth: 1.5, padding: 18, gap: 12,
  },
  instructionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  instructionTitle: { fontSize: 16, fontWeight: '700' },
  instructionSubtitle: { fontSize: 13, lineHeight: 20 },
  detailsList: { gap: 10 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bullet: { width: 7, height: 7, borderRadius: 4 },
  detailText: { fontSize: 14, fontWeight: '500' },
  waButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 18, borderRadius: 14,
    backgroundColor: '#25D366',
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  waButtonText: {
    fontSize: 16, fontWeight: '800', color: '#FFFFFF', letterSpacing: 1.5,
  },
});
