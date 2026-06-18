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
import { TournamentResult, useTournament } from '@/context/TournamentContext';
import { useColors } from '@/hooks/useColors';

type Colors = ReturnType<typeof useColors>;

function ResultField({
  label, value, onChange, placeholder, kb = 'default', colors,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder: string; kb?: 'default' | 'numeric'; colors: Colors;
}) {
  return (
    <View style={fieldStyles.group}>
      <Text style={[fieldStyles.label, { color: colors.mutedForeground }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground + '66'}
        keyboardType={kb}
        style={[fieldStyles.input, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground }]}
      />
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  group: { gap: 4 },
  label: { fontSize: 10, fontWeight: '600', letterSpacing: 0.8 },
  input: { borderWidth: 1, borderRadius: 8, padding: 10, fontSize: 14 },
});

export default function ResultSettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getTournamentById, updateTournament } = useTournament();

  const t = getTournamentById(id ?? '');
  const [results, setResults] = useState<TournamentResult[]>(
    t?.results ?? [
      { rank: 1, playerName: '', uid: '', prize: '', booyahWinner: false },
      { rank: 2, playerName: '', uid: '', prize: '', booyahWinner: false },
      { rank: 3, playerName: '', uid: '', prize: '', booyahWinner: false },
    ]
  );
  const [saving, setSaving] = useState(false);
  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  const updateField = (idx: number, field: keyof TournamentResult, value: string | number | boolean) => {
    setResults(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  };

  const setBooyah = (idx: number) => {
    // Only one player can be Booyah Winner — toggle off others, toggle this one
    setResults(prev => prev.map((r, i) => ({
      ...r,
      booyahWinner: i === idx ? !r.booyahWinner : false,
    })));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const addResult = () => {
    setResults(prev => [...prev, { rank: prev.length + 1, playerName: '', uid: '', prize: '', booyahWinner: false }]);
  };

  const removeResult = (idx: number) => {
    setResults(prev => prev.filter((_, i) => i !== idx).map((r, i) => ({ ...r, rank: i + 1 })));
  };

  const handlePublish = async () => {
    const valid = results.filter(r => r.playerName.trim() && r.prize.trim());
    if (valid.length === 0) { Alert.alert('Error', 'Add at least one winner'); return; }
    setSaving(true);
    try {
      await updateTournament(id ?? '', { results: valid, status: 'completed' });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Published!', 'Results have been published to players.');
      router.back();
    } finally {
      setSaving(false);
    }
  };

  if (!t) return null;

  const rankColors = ['#FFD700', '#C0C0C0', '#CD7F32'];

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: topPadding + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>RESULTS</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[styles.tourneyName, { color: colors.foreground }]}>{t.name}</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Add winners and publish results</Text>

        {results.map((result, i) => {
          const rankColor = rankColors[i] ?? colors.mutedForeground;
          const isBooyah = !!result.booyahWinner;
          return (
            <View key={i} style={[styles.resultCard, { backgroundColor: colors.card, borderColor: isBooyah ? '#FF6B00' + '88' : rankColor + '44' }]}>
              <View style={styles.cardTop}>
                <View style={[styles.rankBadge, { backgroundColor: rankColor + '22', borderColor: rankColor + '55' }]}>
                  <Feather name="award" size={14} color={rankColor} />
                  <Text style={[styles.rankText, { color: rankColor }]}>RANK #{result.rank}</Text>
                </View>
                {i >= 3 && (
                  <TouchableOpacity onPress={() => removeResult(i)} style={styles.removeBtn}>
                    <Feather name="trash-2" size={14} color={colors.destructive} />
                  </TouchableOpacity>
                )}
              </View>

              <ResultField
                label="PLAYER NAME"
                value={result.playerName}
                onChange={v => updateField(i, 'playerName', v)}
                placeholder="Player name"
                colors={colors}
              />
              <ResultField
                label="FREE FIRE UID"
                value={result.uid ?? ''}
                onChange={v => updateField(i, 'uid', v)}
                placeholder="e.g. 1234567890"
                kb="numeric"
                colors={colors}
              />
              <ResultField
                label="PRIZE AMOUNT"
                value={result.prize}
                onChange={v => updateField(i, 'prize', v)}
                placeholder="e.g. ₹500"
                colors={colors}
              />

              {/* Booyah Winner toggle */}
              <TouchableOpacity
                onPress={() => setBooyah(i)}
                style={[
                  styles.booyahRow,
                  {
                    backgroundColor: isBooyah ? '#FF6B00' + '18' : colors.muted,
                    borderColor: isBooyah ? '#FF6B00' + '88' : colors.border,
                  },
                ]}
                activeOpacity={0.8}
              >
                <Text style={styles.booyahIcon}>🏆</Text>
                <View style={styles.booyahTextGroup}>
                  <Text style={[styles.booyahLabel, { color: isBooyah ? '#FF6B00' : colors.foreground }]}>
                    Booyah Winner
                  </Text>
                  <Text style={[styles.booyahSub, { color: colors.mutedForeground }]}>
                    Only one player per tournament
                  </Text>
                </View>
                <View style={[styles.toggle, { backgroundColor: isBooyah ? '#FF6B00' : colors.border }]}>
                  <View style={[styles.toggleThumb, isBooyah && styles.toggleThumbOn]} />
                </View>
              </TouchableOpacity>
            </View>
          );
        })}

        <TouchableOpacity
          onPress={addResult}
          style={[styles.addBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
        >
          <Feather name="plus" size={16} color={colors.mutedForeground} />
          <Text style={[styles.addBtnText, { color: colors.mutedForeground }]}>Add Another Winner</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.publishBtn, { backgroundColor: saving ? colors.gold + '88' : colors.gold }]}
          onPress={handlePublish}
          disabled={saving}
        >
          <Feather name="award" size={16} color="#000000" />
          <Text style={styles.publishBtnText}>{saving ? 'PUBLISHING...' : 'PUBLISH RESULTS'}</Text>
        </TouchableOpacity>
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
  headerTitle: { fontSize: 14, fontWeight: '700', letterSpacing: 2, flex: 1, textAlign: 'center' },
  backBtn: { padding: 8 },
  content: { paddingHorizontal: 16, paddingBottom: 40, gap: 12 },
  tourneyName: { fontSize: 16, fontWeight: '700', marginTop: 4 },
  subtitle: { fontSize: 12 },
  resultCard: { borderRadius: 12, borderWidth: 1, padding: 12, gap: 10 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rankBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, alignSelf: 'flex-start' },
  rankText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  removeBtn: { padding: 4 },
  booyahRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1, borderRadius: 10, padding: 12,
  },
  booyahIcon: { fontSize: 20 },
  booyahTextGroup: { flex: 1 },
  booyahLabel: { fontSize: 14, fontWeight: '700' },
  booyahSub: { fontSize: 11, marginTop: 1 },
  toggle: { width: 44, height: 24, borderRadius: 12, padding: 2, justifyContent: 'center' },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFFFFF' },
  toggleThumbOn: { alignSelf: 'flex-end' },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderRadius: 10, borderStyle: 'dashed', padding: 12 },
  addBtnText: { fontSize: 13, fontWeight: '600' },
  publishBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 12 },
  publishBtnText: { color: '#000000', fontSize: 15, fontWeight: '700', letterSpacing: 1 },
});
