import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';
import { updateUserProfile } from '@/services/authService';

export default function EditProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { firebaseUser, userProfile, refreshProfile } = useAuth();
  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  const [name, setName] = useState(userProfile?.name ?? '');
  const [freeFireUid, setFreeFireUid] = useState(userProfile?.freeFireUid ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name ?? '');
      setFreeFireUid(userProfile.freeFireUid ?? '');
    }
  }, [userProfile]);

  const handleSave = async () => {
    if (!firebaseUser) return;
    if (!name.trim()) {
      Alert.alert('Name Required', 'Please enter your name.');
      return;
    }
    setSaving(true);
    try {
      await updateUserProfile(firebaseUser.uid, {
        name: name.trim(),
        freeFireUid: freeFireUid.trim(),
      });
      await refreshProfile();
      Alert.alert('Saved', 'Your profile has been updated.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const readOnlyRows = [
    { icon: 'mail' as const,      label: 'Email',      value: userProfile?.email || firebaseUser?.email || '—' },
    { icon: 'shield' as const,    label: 'Role',        value: userProfile?.role ? userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1) : '—' },
    { icon: 'key' as const,       label: 'User ID',     value: firebaseUser?.uid || '—' },
    { icon: 'calendar' as const,  label: 'Joined',      value: userProfile?.createdAt
        ? new Date(userProfile.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        : '—' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPadding + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>EDIT PROFILE</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Platform.OS === 'web' ? 40 : insets.bottom + 32 },
        ]}
      >
        {/* Editable fields */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.primary }]}>EDITABLE</Text>

          <View style={[styles.fieldWrap, { borderBottomColor: colors.border }]}>
            <View style={styles.fieldLabelRow}>
              <Feather name="user" size={13} color={colors.mutedForeground} />
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Name</Text>
            </View>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Your display name"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.muted }]}
              autoCapitalize="words"
              returnKeyType="next"
            />
          </View>

          <View style={styles.fieldWrap}>
            <View style={styles.fieldLabelRow}>
              <Feather name="crosshair" size={13} color={colors.mutedForeground} />
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Free Fire UID</Text>
            </View>
            <TextInput
              value={freeFireUid}
              onChangeText={setFreeFireUid}
              placeholder="Your Free Fire UID"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.muted }]}
              keyboardType="default"
              autoCapitalize="none"
              returnKeyType="done"
            />
          </View>
        </View>

        {/* Read-only fields */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>READ ONLY</Text>
          {readOnlyRows.map((row, i) => (
            <View
              key={row.label}
              style={[
                styles.readRow,
                { borderBottomColor: colors.border, borderBottomWidth: i < readOnlyRows.length - 1 ? 1 : 0 },
              ]}
            >
              <View style={styles.readLeft}>
                <Feather name={row.icon} size={13} color={colors.mutedForeground} />
                <Text style={[styles.readLabel, { color: colors.mutedForeground }]}>{row.label}</Text>
              </View>
              <Text style={[styles.readValue, { color: colors.foreground }]} numberOfLines={1} selectable>
                {row.value}
              </Text>
            </View>
          ))}
        </View>

        {/* Save button */}
        <TouchableOpacity
          style={[
            styles.saveBtn,
            { backgroundColor: colors.primary },
            saving && { opacity: 0.65 },
          ]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving
            ? <ActivityIndicator size="small" color="#000" />
            : <Feather name="check" size={18} color="#000" />
          }
          <Text style={styles.saveBtnText}>{saving ? 'SAVING...' : 'SAVE CHANGES'}</Text>
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
  headerTitle: { fontSize: 14, fontWeight: '700', letterSpacing: 2 },
  backBtn: { padding: 8 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 8, gap: 14 },

  section: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 14 },
  sectionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },

  fieldWrap: { gap: 8, paddingBottom: 14, borderBottomWidth: 1 },
  fieldLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  fieldLabel: { fontSize: 12, fontWeight: '600' },
  input: {
    height: 46, borderRadius: 10, borderWidth: 1,
    paddingHorizontal: 12, fontSize: 15,
  },

  readRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 11,
  },
  readLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  readLabel: { fontSize: 13 },
  readValue: { fontSize: 13, fontWeight: '500', maxWidth: '55%', textAlign: 'right' },

  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 17, borderRadius: 14,
  },
  saveBtnText: { fontSize: 15, fontWeight: '800', color: '#000', letterSpacing: 1 },
});
