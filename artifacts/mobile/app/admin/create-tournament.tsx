import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
import { TournamentCategory, TournamentStatus, useTournament } from '@/context/TournamentContext';
import { formatTimeIST } from '@/utils/time';
import { useColors } from '@/hooks/useColors';

type Colors = ReturnType<typeof useColors>;

function Field({
  label, value, setter, placeholder, kb = 'default', hint, colors,
}: {
  label: string; value: string; setter: (v: string) => void; placeholder: string;
  kb?: 'default' | 'numeric'; hint?: string; colors: Colors;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>{label.toUpperCase()}</Text>
      <TextInput
        value={value}
        onChangeText={setter}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground + '66'}
        keyboardType={kb}
        style={[styles.input, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground }]}
      />
      {hint ? <Text style={[styles.hint, { color: colors.mutedForeground }]}>{hint}</Text> : null}
    </View>
  );
}

const CATEGORIES: TournamentCategory[] = ['Solo', 'Duo', 'Squad', '1v1'];
const STATUSES: TournamentStatus[] = ['upcoming', 'live', 'completed', 'closed'];

const QUICK_TIMES = [
  { label: '2:00 PM', value: '14:00' },
  { label: '6:00 PM', value: '18:00' },
  { label: '8:00 PM', value: '20:00' },
  { label: '11:00 PM', value: '23:00' },
];

export default function CreateTournamentScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { addTournament, updateTournament, getTournamentById } = useTournament();

  const existing = id ? getTournamentById(id) : undefined;
  const isEdit = !!existing;

  const [name, setName] = useState(existing?.name ?? '');
  const [category, setCategory] = useState<TournamentCategory>(existing?.category ?? 'Solo');
  const [entryFee, setEntryFee] = useState(existing?.entryFee.toString() ?? '');
  const [perKillPrize, setPerKillPrize] = useState(existing?.perKillPrize?.toString() ?? '');
  const [booyahPrize, setBooyahPrize] = useState(existing?.booyahPrize?.toString() ?? '');
  const [date, setDate] = useState(existing?.date ?? '');
  const [time, setTime] = useState(existing?.time ?? '');
  const [slots, setSlots] = useState(existing?.slots.toString() ?? '');
  const [gameMode, setGameMode] = useState(existing?.gameMode ?? 'Classic');
  const [rules, setRules] = useState(existing?.rules ?? '');
  const [status, setStatus] = useState<TournamentStatus>(existing?.status ?? 'upcoming');
  const [repeatDaily, setRepeatDaily] = useState(existing?.repeatDaily ?? false);
  const [published, setPublished] = useState(existing?.published ?? false);
  const [saving, setSaving] = useState(false);

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  const validate = () => {
    if (!name.trim()) { Alert.alert('Error', 'Tournament name is required'); return false; }
    if (!entryFee || isNaN(Number(entryFee))) { Alert.alert('Error', 'Valid entry fee is required'); return false; }
    if (!perKillPrize || isNaN(Number(perKillPrize))) { Alert.alert('Error', 'Valid per kill prize is required'); return false; }
    if (!booyahPrize || isNaN(Number(booyahPrize))) { Alert.alert('Error', 'Valid booyah prize is required'); return false; }
    if (!repeatDaily && !date.trim()) { Alert.alert('Error', 'Date is required for one-time tournaments'); return false; }
    if (!time.trim()) { Alert.alert('Error', 'Time is required'); return false; }
    if (!/^\d{2}:\d{2}$/.test(time.trim())) { Alert.alert('Error', 'Time must be in HH:MM format (e.g. 14:00 for 2:00 PM IST)'); return false; }
    if (!slots || isNaN(Number(slots))) { Alert.alert('Error', 'Valid slot count is required'); return false; }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
      const data = {
        name: name.trim(),
        category,
        entryFee: Number(entryFee),
        perKillPrize: Number(perKillPrize),
        booyahPrize: Number(booyahPrize),
        date: repeatDaily ? todayStr : date.trim(),
        time: time.trim(),
        slots: Number(slots),
        gameMode: gameMode.trim(),
        rules: rules.trim(),
        status,
        repeatDaily,
        published,
      };
      if (isEdit && id) {
        await updateTournament(id, data);
      } else {
        await addTournament(data);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch {
      Alert.alert('Error', 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
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
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          {isEdit ? 'EDIT TOURNAMENT' : 'CREATE TOURNAMENT'}
        </Text>
        <TouchableOpacity onPress={handleSave} disabled={saving} style={[styles.saveBtn, { backgroundColor: colors.primary }]}>
          <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>{saving ? '...' : 'SAVE'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Field label="Tournament Name" value={name} setter={setName} placeholder="e.g. Booyah Cup" colors={colors} />

        {/* Prize configuration */}
        <View style={[styles.prizeSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.prizeSectionHeader}>
            <Feather name="award" size={14} color={colors.gold} />
            <Text style={[styles.prizeSectionTitle, { color: colors.foreground }]}>Prize Configuration</Text>
          </View>
          <View style={styles.prizeRow}>
            <View style={styles.prizeField}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>ENTRY FEE (₹)</Text>
              <TextInput
                value={entryFee}
                onChangeText={setEntryFee}
                placeholder="50"
                placeholderTextColor={colors.mutedForeground + '66'}
                keyboardType="numeric"
                style={[styles.input, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground }]}
              />
            </View>
            <View style={styles.prizeField}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>PER KILL (₹)</Text>
              <TextInput
                value={perKillPrize}
                onChangeText={setPerKillPrize}
                placeholder="20"
                placeholderTextColor={colors.mutedForeground + '66'}
                keyboardType="numeric"
                style={[styles.input, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground }]}
              />
            </View>
            <View style={styles.prizeField}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>BOOYAH (₹)</Text>
              <TextInput
                value={booyahPrize}
                onChangeText={setBooyahPrize}
                placeholder="51"
                placeholderTextColor={colors.mutedForeground + '66'}
                keyboardType="numeric"
                style={[styles.input, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground }]}
              />
            </View>
          </View>
        </View>

        {/* Repeat Daily toggle */}
        <TouchableOpacity
          onPress={() => { setRepeatDaily(!repeatDaily); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
          style={[styles.toggleRow, { backgroundColor: colors.card, borderColor: repeatDaily ? colors.primary + '66' : colors.border }]}
        >
          <View style={styles.toggleContent}>
            <View style={[styles.toggleIconWrap, { backgroundColor: (repeatDaily ? colors.primary : colors.border) + '33' }]}>
              <Feather name="repeat" size={16} color={repeatDaily ? colors.primary : colors.mutedForeground} />
            </View>
            <View>
              <Text style={[styles.toggleLabel, { color: colors.foreground }]}>Repeat Daily</Text>
              <Text style={[styles.toggleSub, { color: colors.mutedForeground }]}>
                {repeatDaily ? 'Runs every day at the same time (e.g. 8:00 PM Daily)' : 'Runs only on selected date'}
              </Text>
            </View>
          </View>
          <View style={[styles.toggle, { backgroundColor: repeatDaily ? colors.primary : colors.muted }]}>
            <View style={[styles.toggleThumb, repeatDaily && styles.toggleThumbOn]} />
          </View>
        </TouchableOpacity>

        {/* Date (only for one-time tournaments) */}
        {!repeatDaily && (
          <Field
            label="Date (YYYY-MM-DD)"
            value={date}
            setter={setDate}
            placeholder="2025-12-31"
            hint="Format: YYYY-MM-DD (e.g. 2025-12-31)"
            colors={colors}
          />
        )}
        {repeatDaily && (
          <View style={[styles.dailyNote, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '44' }]}>
            <Feather name="info" size={13} color={colors.primary} />
            <Text style={[styles.dailyNoteText, { color: colors.primary }]}>
              Daily tournaments repeat every day at the selected time. Date is set automatically.
            </Text>
          </View>
        )}

        {/* Time with quick-select */}
        <View style={styles.fieldGroup}>
          <View style={styles.timeLabelRow}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>TIME (24-HOUR IST)</Text>
            {time ? (
              <View style={[styles.timePreview, { backgroundColor: colors.primary + '22', borderColor: colors.primary + '44' }]}>
                <Feather name="clock" size={11} color={colors.primary} />
                <Text style={[styles.timePreviewText, { color: colors.primary }]}>{formatTimeIST(time)} IST</Text>
              </View>
            ) : null}
          </View>
          <TextInput
            value={time}
            onChangeText={setTime}
            placeholder="14:00"
            placeholderTextColor={colors.mutedForeground + '66'}
            keyboardType="numbers-and-punctuation"
            style={[styles.input, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground }]}
          />
          <Text style={[styles.hint, { color: colors.mutedForeground }]}>Quick select (IST):</Text>
          <View style={styles.quickTimeRow}>
            {QUICK_TIMES.map(qt => {
              const active = time === qt.value;
              return (
                <TouchableOpacity
                  key={qt.value}
                  onPress={() => { setTime(qt.value); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                  style={[styles.quickChip, { borderColor: active ? colors.primary : colors.border }, active && { backgroundColor: colors.primary + '22' }]}
                >
                  <Text style={[styles.quickChipText, { color: active ? colors.primary : colors.mutedForeground }]}>{qt.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <Field label="Total Slots" value={slots} setter={setSlots} placeholder="100" kb="numeric" colors={colors} />
        <Field label="Game Mode" value={gameMode} setter={setGameMode} placeholder="Classic / Clash Squad" colors={colors} />

        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>RULES & GUIDELINES (optional)</Text>
          <TextInput
            value={rules}
            onChangeText={setRules}
            placeholder="Enter tournament rules, format, and guidelines..."
            placeholderTextColor={colors.mutedForeground + '66'}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            style={[styles.textarea, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground }]}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>CATEGORY</Text>
          <View style={styles.chipRow}>
            {CATEGORIES.map(c => (
              <TouchableOpacity key={c} onPress={() => setCategory(c)}
                style={[styles.chip, { borderColor: category === c ? colors.primary : colors.border }, category === c && { backgroundColor: colors.primary + '22' }]}
              >
                <Text style={[styles.chipText, { color: category === c ? colors.primary : colors.mutedForeground }]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>STATUS</Text>
          <View style={styles.chipRow}>
            {STATUSES.map(s => (
              <TouchableOpacity key={s} onPress={() => setStatus(s)}
                style={[styles.chip, { borderColor: status === s ? colors.accent : colors.border }, status === s && { backgroundColor: colors.accent + '22' }]}
              >
                <Text style={[styles.chipText, { color: status === s ? colors.accent : colors.mutedForeground }]}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity onPress={() => setPublished(!published)}
          style={[styles.toggleRow, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={styles.toggleContent}>
            <View style={[styles.toggleIconWrap, { backgroundColor: (published ? colors.success : colors.border) + '33' }]}>
              <Feather name="eye" size={16} color={published ? colors.success : colors.mutedForeground} />
            </View>
            <View>
              <Text style={[styles.toggleLabel, { color: colors.foreground }]}>Published</Text>
              <Text style={[styles.toggleSub, { color: colors.mutedForeground }]}>Visible to players on home screen</Text>
            </View>
          </View>
          <View style={[styles.toggle, { backgroundColor: published ? colors.primary : colors.muted }]}>
            <View style={[styles.toggleThumb, published && styles.toggleThumbOn]} />
          </View>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 8 },
  headerTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 1.5, flex: 1, textAlign: 'center' },
  backBtn: { padding: 8 },
  saveBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  saveBtnText: { fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 40, gap: 12 },
  fieldGroup: { gap: 6 },
  label: { fontSize: 10, fontWeight: '600', letterSpacing: 1 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 14 },
  textarea: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 14, minHeight: 100 },
  hint: { fontSize: 11, lineHeight: 16 },
  prizeSection: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 10 },
  prizeSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  prizeSectionTitle: { fontSize: 13, fontWeight: '700' },
  prizeRow: { flexDirection: 'row', gap: 8 },
  prizeField: { flex: 1, gap: 5 },
  dailyNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderRadius: 8, borderWidth: 1, padding: 10 },
  dailyNoteText: { fontSize: 12, flex: 1, lineHeight: 17 },
  timeLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timePreview: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  timePreviewText: { fontSize: 11, fontWeight: '700' },
  quickTimeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  quickChipText: { fontSize: 12, fontWeight: '600' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: '600' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: 12, padding: 14 },
  toggleContent: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  toggleIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  toggleLabel: { fontSize: 14, fontWeight: '600' },
  toggleSub: { fontSize: 11, marginTop: 2, maxWidth: 220 },
  toggle: { width: 48, height: 26, borderRadius: 13, padding: 3, justifyContent: 'center' },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFFFFF' },
  toggleThumbOn: { alignSelf: 'flex-end' },
});
