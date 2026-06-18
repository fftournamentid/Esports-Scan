import { Feather } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { requestNotificationPermission, scheduleMatchNotifications } from '@/utils/notifications';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CountdownTimer from '@/components/CountdownTimer';
import StatusBadge from '@/components/StatusBadge';
import { useAuth } from '@/context/AuthContext';
import { useTournament } from '@/context/TournamentContext';
import { useColors } from '@/hooks/useColors';
import { formatDateDisplay, formatTimeIST, getNextDailyOccurrenceIST } from '@/utils/time';

const CATEGORY_COLORS: Record<string, string> = {
  Solo: '#FF6B00', Duo: '#4DA6FF', Squad: '#30D158', '1v1': '#FF3B30',
};

const HOW_TO_JOIN_ITEMS = [
  'Player Name (auto-filled from your profile)',
  'Free Fire UID (auto-filled from your profile)',
  'Tournament Name',
  'UTR Number (Transaction ID)',
  'Payment Screenshot',
];

export default function TournamentDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getTournamentById, getJoinByTournamentId, paymentSettings, joinTournament } = useTournament();
  const { firebaseUser, userProfile } = useAuth();

  const t = getTournamentById(id ?? '');
  const existingJoin = getJoinByTournamentId(id ?? '');
  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  const [transactionId, setTransactionId] = useState('');
  const [joining, setJoining] = useState(false);

  if (!t) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPadding + 8 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>TOURNAMENT</Text>
          <View style={{ width: 38 }} />
        </View>
        <View style={styles.centered}>
          <Feather name="alert-circle" size={40} color={colors.destructive} />
          <Text style={[styles.notFoundText, { color: colors.foreground }]}>Tournament not found</Text>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backLink, { borderColor: colors.border }]}>
            <Text style={[{ color: colors.primary, fontWeight: '600' }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const catColor = CATEGORY_COLORS[t.category] ?? colors.primary;
  const slotsLeft = t.slots - t.slotsUsed;
  const canJoin = t.status === 'upcoming' && slotsLeft > 0 && !existingJoin;
  const upiLink = `upi://pay?pa=${encodeURIComponent(paymentSettings.upiId)}&pn=FreeFire%20Tournament&am=${t.entryFee}&tn=Tournament%20Entry`;

  const countdownDate = t.repeatDaily
    ? getNextDailyOccurrenceIST(t.time).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
    : t.date;

  const handleJoinWhatsApp = async () => {
    if (!firebaseUser) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to join tournaments.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => router.push('/auth/login' as never) },
        ]
      );
      return;
    }

    if (!transactionId.trim()) {
      Alert.alert('Transaction ID Required', 'Please enter your UTR/Transaction ID after paying the entry fee.');
      return;
    }

    setJoining(true);
    try {
      const playerName = userProfile?.name ?? firebaseUser.displayName ?? 'Player';
      const freeFireUid = userProfile?.freeFireUid ?? '';

      await joinTournament({
        tournamentId: t.id,
        playerName,
        uid: freeFireUid,
        transactionId: transactionId.trim(),
        hasScreenshot: false,
        tournamentName: t.name,
        tournamentTime: t.time,
        tournamentDate: t.date,
      });

      const msg = [
        `*🎮 Free Fire Tournament Registration*`,
        ``,
        `Tournament: ${t.name}`,
        `Date: ${t.repeatDaily ? 'Daily' : formatDateDisplay(t.date)}`,
        `Time: ${formatTimeIST(t.time)} IST`,
        `Category: ${t.category}`,
        ``,
        `Player Name: ${playerName}`,
        `Free Fire UID: ${freeFireUid || '[Enter UID]'}`,
        `UTR Number: ${transactionId.trim()}`,
        `Payment Screenshot: [Attach screenshot]`,
        ``,
        `Please verify and approve my entry. Thank you! 🙏`,
      ].join('\n');

      try {
        const granted = await requestNotificationPermission();
        if (granted) {
          const notifDate = t.repeatDaily
            ? getNextDailyOccurrenceIST(t.time).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
            : t.date;
          await scheduleMatchNotifications(t.id, notifDate, t.time);
        }
      } catch {
      }

      Linking.openURL(`https://wa.me/${paymentSettings.whatsappNumber}?text=${encodeURIComponent(msg)}`);
    } catch (err: unknown) {
      Alert.alert('Error', (err as Error).message ?? 'Could not register. Please try again.');
    } finally {
      setJoining(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPadding + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>TOURNAMENT</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: Platform.OS === 'web' ? 40 : insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero card */}
        <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.primary + '44' }]}>
          <View style={styles.heroTop}>
            <View style={[styles.catBadge, { backgroundColor: catColor + '22', borderColor: catColor + '66' }]}>
              <Text style={[styles.catText, { color: catColor }]}>{t.category}</Text>
            </View>
            <View style={styles.heroBadgeRow}>
              {t.repeatDaily && (
                <View style={[styles.dailyBadge, { backgroundColor: colors.accent + '22', borderColor: colors.accent + '55' }]}>
                  <Feather name="repeat" size={10} color={colors.accent} />
                  <Text style={[styles.dailyBadgeText, { color: colors.accent }]}>DAILY</Text>
                </View>
              )}
              <StatusBadge type="tournament" status={t.status} />
            </View>
          </View>
          <Text style={[styles.tourneyName, { color: colors.foreground }]}>{t.name}</Text>
          {t.gameMode && <Text style={[styles.gameMode, { color: colors.mutedForeground }]}>Mode: {t.gameMode}</Text>}
        </View>

        {/* Stats row */}
        <View style={[styles.statsRow, { borderColor: colors.border }]}>
          {[
            { label: 'ENTRY FEE', value: `₹${t.entryFee}`, color: colors.primary },
            { label: 'PER KILL', value: `₹${t.perKillPrize ?? 0}`, color: colors.gold },
            { label: 'BOOYAH', value: `₹${t.booyahPrize ?? 0}`, color: colors.success },
          ].map((s, i) => (
            <React.Fragment key={s.label}>
              {i > 0 && <View style={[styles.statDivider, { backgroundColor: colors.border }]} />}
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
                <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>

        {/* Info rows */}
        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {[
            { icon: 'calendar' as const, label: 'Date', value: t.repeatDaily ? 'Every Day' : formatDateDisplay(t.date) },
            { icon: 'clock' as const, label: 'Time (IST)', value: `${formatTimeIST(t.time)} IST` },
            { icon: 'users' as const, label: 'Category', value: t.category },
            { icon: 'cpu' as const, label: 'Mode', value: t.gameMode ?? 'Classic' },
            { icon: 'grid' as const, label: 'Slots Left', value: slotsLeft <= 0 ? 'FULL' : `${slotsLeft} / ${t.slots}` },
          ].map((row, i, arr) => (
            <View key={row.label} style={[styles.infoRow, { borderBottomColor: colors.border, borderBottomWidth: i < arr.length - 1 ? 1 : 0 }]}>
              <View style={styles.infoLeft}>
                <Feather name={row.icon} size={14} color={colors.primary} />
                <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{row.label}</Text>
              </View>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>{row.value}</Text>
            </View>
          ))}
        </View>

        {/* Rules */}
        {t.rules ? (
          <View style={[styles.rulesCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.rowGap}>
              <Feather name="file-text" size={14} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Rules & Guidelines</Text>
            </View>
            <Text style={[styles.rulesText, { color: colors.mutedForeground }]}>{t.rules}</Text>
          </View>
        ) : null}

        {/* Countdown */}
        {t.status === 'upcoming' && (
          <View style={[styles.countdownCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.countdownTitle, { color: colors.mutedForeground }]}>
              {t.repeatDaily ? 'NEXT MATCH IN' : 'STARTS IN'}
            </Text>
            <CountdownTimer targetDate={countdownDate} targetTime={t.time} />
          </View>
        )}

        {/* QR + UPI */}
        {canJoin && (
          <View style={[styles.payCard, { backgroundColor: colors.card, borderColor: colors.primary + '44' }]}>
            <Text style={[styles.payTitle, { color: colors.mutedForeground }]}>PAY ENTRY FEE — ₹{t.entryFee}</Text>
            <View style={styles.qrContainer}>
              <View style={[styles.qrWrapper, { backgroundColor: '#FFFFFF', borderColor: colors.primary }]}>
                <QRCode value={upiLink} size={140} color="#000000" backgroundColor="#FFFFFF" />
              </View>
              <Text style={[styles.qrNote, { color: colors.mutedForeground }]}>Scan to pay via any UPI app</Text>
            </View>
            <View style={[styles.upiRow, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <Feather name="credit-card" size={13} color={colors.primary} />
              <Text style={[styles.upiLabel, { color: colors.mutedForeground }]}>UPI ID:</Text>
              <Text style={[styles.upiId, { color: colors.primary }]}>{paymentSettings.upiId}</Text>
            </View>
            <Text style={[styles.upiNote, { color: colors.mutedForeground }]}>PhonePe · GPay · Paytm · All UPI apps</Text>
          </View>
        )}

        {/* How To Join + Register Form + WhatsApp button */}
        {canJoin && (
          <>
            <View style={styles.howToCard}>
              <View style={styles.howToHeader}>
                <Feather name="message-circle" size={20} color="#25D366" />
                <Text style={styles.howToTitle}>How To Join</Text>
              </View>
              <Text style={styles.howToSubtitle}>
                Send the following details on WhatsApp to register:
              </Text>
              <View style={styles.howToList}>
                {HOW_TO_JOIN_ITEMS.map((item, i) => (
                  <View key={i} style={styles.howToItem}>
                    <View style={styles.howToBullet} />
                    <Text style={styles.howToText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Login prompt for unauthenticated users */}
            {!firebaseUser ? (
              <View style={[styles.loginPrompt, { backgroundColor: colors.card, borderColor: colors.primary + '55' }]}>
                <Feather name="user" size={20} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.loginPromptTitle, { color: colors.foreground }]}>Sign In to Join</Text>
                  <Text style={[styles.loginPromptSub, { color: colors.mutedForeground }]}>
                    Create an account to register for tournaments
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.loginBtn, { backgroundColor: colors.primary }]}
                  onPress={() => router.push('/auth/login' as never)}
                >
                  <Text style={styles.loginBtnText}>Sign In</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {/* Transaction ID input */}
                <View style={[styles.txnCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.txnLabel, { color: colors.mutedForeground }]}>UTR / TRANSACTION ID</Text>
                  <View style={[styles.txnInputWrap, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                    <Feather name="hash" size={16} color={colors.primary} style={{ marginRight: 8 }} />
                    <TextInput
                      value={transactionId}
                      onChangeText={setTransactionId}
                      placeholder="Enter your payment UTR number"
                      placeholderTextColor={colors.mutedForeground}
                      style={[styles.txnInput, { color: colors.foreground }]}
                      keyboardType="default"
                      autoCapitalize="characters"
                    />
                  </View>
                  <Text style={[styles.txnHint, { color: colors.border }]}>
                    Found in your UPI app under payment history
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.waButton, { opacity: joining ? 0.7 : 1 }]}
                  onPress={handleJoinWhatsApp}
                  disabled={joining}
                  activeOpacity={0.85}
                >
                  {joining
                    ? <ActivityIndicator size="small" color="#FFFFFF" />
                    : <Feather name="message-circle" size={22} color="#FFFFFF" />
                  }
                  <Text style={styles.waButtonText}>
                    {joining ? 'REGISTERING...' : 'JOIN ON WHATSAPP'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </>
        )}

        {/* Already joined */}
        {existingJoin && (
          <View style={[styles.joinedCard, { backgroundColor: colors.success + '18', borderColor: colors.success + '44' }]}>
            <Feather name="check-circle" size={20} color={colors.success} />
            <View style={styles.joinedTextGroup}>
              <Text style={[styles.joinedTitle, { color: colors.success }]}>YOU HAVE JOINED</Text>
              <Text style={[styles.joinedSub, { color: colors.mutedForeground }]}>
                Status: {existingJoin.status === 'pending' ? 'Waiting for admin approval' :
                  existingJoin.status === 'approved' ? 'Approved — room info coming soon' :
                    existingJoin.status === 'room_released' ? 'Room Released — check My Tournaments' :
                      'Completed'}
              </Text>
            </View>
            {existingJoin.status === 'room_released' && (
              <TouchableOpacity
                onPress={() => router.push(`/room/${t.id}` as never)}
                style={[styles.viewRoomBtn, { backgroundColor: colors.accent }]}
              >
                <Text style={styles.viewRoomText}>VIEW</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Closed / Full banners */}
        {!canJoin && !existingJoin && (
          <View style={[styles.statusBanner, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <Feather name="x-circle" size={16} color={colors.mutedForeground} />
            <Text style={[styles.statusBannerText, { color: colors.mutedForeground }]}>
              {t.status === 'live' ? 'TOURNAMENT IS LIVE — REGISTRATION CLOSED' :
                t.status === 'completed' ? 'TOURNAMENT ENDED' :
                  t.status === 'closed' ? 'REGISTRATION CLOSED' :
                    slotsLeft <= 0 ? 'ALL SLOTS FULL' : 'REGISTRATION UNAVAILABLE'}
            </Text>
          </View>
        )}

        {/* Results button */}
        {t.status === 'completed' && t.results?.length ? (
          <TouchableOpacity
            style={[styles.resultsBtn, { backgroundColor: colors.gold + '22', borderColor: colors.gold + '66' }]}
            onPress={() => router.push(`/results/${t.id}` as never)}
          >
            <Feather name="award" size={16} color={colors.gold} />
            <Text style={[styles.resultsBtnText, { color: colors.gold }]}>VIEW RESULTS</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 8 },
  headerTitle: { fontSize: 14, fontWeight: '700', letterSpacing: 2 },
  backBtn: { padding: 8 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  notFoundText: { fontSize: 16, fontWeight: '600' },
  backLink: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  content: { paddingHorizontal: 16, paddingTop: 4, gap: 12 },
  heroCard: { borderRadius: 14, borderWidth: 1, padding: 16 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  heroBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  catBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, borderWidth: 1 },
  catText: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  dailyBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4, borderWidth: 1 },
  dailyBadgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  tourneyName: { fontSize: 20, fontWeight: '700', lineHeight: 26 },
  gameMode: { fontSize: 12, marginTop: 4 },
  statsRow: { flexDirection: 'row', borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  statItem: { flex: 1, alignItems: 'center', padding: 14 },
  statLabel: { fontSize: 9, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: '700' },
  statDivider: { width: 1 },
  infoCard: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12 },
  infoLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoLabel: { fontSize: 13 },
  infoValue: { fontSize: 13, fontWeight: '600' },
  rulesCard: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 8 },
  rulesText: { fontSize: 13, lineHeight: 20 },
  countdownCard: { borderRadius: 12, borderWidth: 1, padding: 16, alignItems: 'center', gap: 8 },
  countdownTitle: { fontSize: 10, fontWeight: '700', letterSpacing: 2 },
  payCard: { borderRadius: 14, borderWidth: 1, padding: 16, alignItems: 'center', gap: 12 },
  payTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  qrContainer: { alignItems: 'center', gap: 8 },
  qrWrapper: { padding: 10, borderRadius: 12, borderWidth: 2 },
  qrNote: { fontSize: 12 },
  upiRow: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, alignSelf: 'stretch' },
  upiLabel: { fontSize: 12 },
  upiId: { fontSize: 13, fontWeight: '700', flex: 1 },
  upiNote: { fontSize: 11 },
  rowGap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 14, fontWeight: '700' },
  howToCard: {
    borderRadius: 14, borderWidth: 1.5, borderColor: '#25D366' + '88',
    backgroundColor: '#071A0E', padding: 18, gap: 12,
  },
  howToHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  howToTitle: { fontSize: 17, fontWeight: '800', color: '#25D366' },
  howToSubtitle: { fontSize: 13, color: '#CCCCCC', lineHeight: 20 },
  howToList: { gap: 10 },
  howToItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  howToBullet: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#25D366' },
  howToText: { fontSize: 14, fontWeight: '500', color: '#EEEEEE' },
  loginPrompt: {
    flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5,
    borderRadius: 14, padding: 14,
  },
  loginPromptTitle: { fontSize: 14, fontWeight: '700' },
  loginPromptSub: { fontSize: 12, marginTop: 2 },
  loginBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  loginBtnText: { fontSize: 13, fontWeight: '700', color: '#000' },
  txnCard: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 8 },
  txnLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  txnInputWrap: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 10, borderWidth: 1,
    paddingHorizontal: 12, height: 48,
  },
  txnInput: { flex: 1, fontSize: 15, letterSpacing: 0.5 },
  txnHint: { fontSize: 11, lineHeight: 16 },
  waButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 18, borderRadius: 14,
    backgroundColor: '#25D366',
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 10,
  },
  waButtonText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF', letterSpacing: 1.5 },
  joinedCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 12, padding: 14 },
  joinedTextGroup: { flex: 1 },
  joinedTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
  joinedSub: { fontSize: 12, marginTop: 2 },
  viewRoomBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  viewRoomText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  statusBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 10, padding: 14 },
  statusBannerText: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5 },
  resultsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderRadius: 12, padding: 14 },
  resultsBtnText: { fontSize: 13, fontWeight: '700', letterSpacing: 1 },
});
