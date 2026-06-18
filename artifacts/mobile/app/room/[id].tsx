import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CountdownTimer from '@/components/CountdownTimer';
import { useTournament } from '@/context/TournamentContext';
import { useColors } from '@/hooks/useColors';

export default function RoomInfoScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getTournamentById, getJoinByTournamentId } = useTournament();

  const t = getTournamentById(id ?? '');
  const join = getJoinByTournamentId(id ?? '');
  const [copiedRoom, setCopiedRoom] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  const copyField = async (value: string, type: 'room' | 'pass') => {
    await Clipboard.setStringAsync(value);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (type === 'room') { setCopiedRoom(true); setTimeout(() => setCopiedRoom(false), 2000); }
    else { setCopiedPass(true); setTimeout(() => setCopiedPass(false), 2000); }
  };

  if (!t || join?.status !== 'room_released') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPadding + 8 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>ROOM INFO</Text>
          <View style={{ width: 38 }} />
        </View>
        <View style={styles.empty}>
          <Feather name="lock" size={48} color={colors.border} />
          <Text style={[styles.emptyTitle, { color: colors.mutedForeground }]}>Room Not Released Yet</Text>
          <Text style={[styles.emptyText, { color: colors.border }]}>
            Room details will appear when admin releases them
          </Text>
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
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>ROOM INFO</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.primary + '55' }]}>
          <View style={[styles.heroIcon, { backgroundColor: colors.primary + '22' }]}>
            <Feather name="unlock" size={28} color={colors.primary} />
          </View>
          <Text style={[styles.heroTitle, { color: colors.foreground }]}>{t.name}</Text>
          <Text style={[styles.heroSub, { color: colors.mutedForeground }]}>{t.date} · {t.time}</Text>
        </View>

        <View style={[styles.alert, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '44' }]}>
          <Feather name="alert-circle" size={14} color={colors.primary} />
          <Text style={[styles.alertText, { color: colors.primary }]}>
            Do not share Room ID and Password with anyone
          </Text>
        </View>

        {[
          { label: 'ROOM ID', value: t.roomId ?? '', copied: copiedRoom, onCopy: () => copyField(t.roomId ?? '', 'room') },
          { label: 'PASSWORD', value: t.roomPassword ?? '', copied: copiedPass, onCopy: () => copyField(t.roomPassword ?? '', 'pass') },
        ].map(field => (
          <View key={field.label} style={[styles.fieldCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{field.label}</Text>
            <View style={styles.fieldRow}>
              <Text style={[styles.fieldValue, { color: colors.primary }]}>{field.value}</Text>
              <TouchableOpacity
                onPress={field.onCopy}
                style={[styles.copyBtn, { backgroundColor: field.copied ? colors.success + '22' : colors.muted }]}
              >
                <Feather name={field.copied ? 'check' : 'copy'} size={16} color={field.copied ? colors.success : colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {t.roomReleaseTime && t.date && (
          <View style={[styles.countdownCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.countdownLabel, { color: colors.mutedForeground }]}>MATCH STARTS IN</Text>
            <CountdownTimer targetDate={t.date} targetTime={t.time} />
          </View>
        )}

        <View style={[styles.tipCard, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <Text style={[styles.tipTitle, { color: colors.foreground }]}>How to join:</Text>
          {['Open Free Fire app', 'Go to Custom Room', 'Enter Room ID and Password', 'Wait for host to start the match'].map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <View style={[styles.tipNum, { backgroundColor: colors.primary + '33' }]}>
                <Text style={[styles.tipNumText, { color: colors.primary }]}>{i + 1}</Text>
              </View>
              <Text style={[styles.tipText, { color: colors.foreground }]}>{tip}</Text>
            </View>
          ))}
        </View>
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
  headerTitle: { fontSize: 14, fontWeight: '700', letterSpacing: 2 },
  backBtn: { padding: 8 },
  content: { paddingHorizontal: 16, paddingBottom: 30 },
  heroCard: { borderRadius: 14, borderWidth: 1, padding: 20, alignItems: 'center', marginBottom: 12, gap: 8 },
  heroIcon: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  heroTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center', fontFamily: 'Inter_700Bold' },
  heroSub: { fontSize: 12 },
  alert: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 8, borderWidth: 1, marginBottom: 12 },
  alertText: { fontSize: 12, fontWeight: '600', flex: 1, lineHeight: 16 },
  fieldCard: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 10 },
  fieldLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 1, marginBottom: 6 },
  fieldRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  fieldValue: { fontSize: 22, fontWeight: '700', fontFamily: 'Inter_700Bold', flex: 1, letterSpacing: 2 },
  copyBtn: { padding: 10, borderRadius: 8 },
  countdownCard: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 12, alignItems: 'center', gap: 8 },
  countdownLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 2 },
  tipCard: { borderRadius: 12, borderWidth: 1, padding: 14 },
  tipTitle: { fontSize: 13, fontWeight: '700', marginBottom: 10 },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  tipNum: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  tipNumText: { fontSize: 11, fontWeight: '700' },
  tipText: { fontSize: 13, flex: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '600' },
  emptyText: { fontSize: 13, textAlign: 'center', lineHeight: 18 },
});
