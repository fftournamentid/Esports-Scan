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
  const [editingName, setEditingName] = useState(false);
  const [editingUid, setEditingUid] = useState(false);
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
    setEditingName(false);
    setEditingUid(false);
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
      Alert.alert('Error', 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

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
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>

          {/* Name field */}
          <View style={[styles.fieldRow, { borderBottomColor: colors.border }]}>
            <View style={styles.fieldLeft}>
              <View style={[styles.iconWrap, { backgroundColor: colors.primary + '18' }]}>
                <Feather name="user" size={15} color={colors.primary} />
              </View>
              <View style={styles.fieldContent}>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Name</Text>
                {editingName ? (
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    autoFocus
                    placeholder="Your name"
                    placeholderTextColor={colors.mutedForeground}
                    style={[styles.inlineInput, { color: colors.foreground, borderColor: colors.primary + '66' }]}
                    autoCapitalize="words"
                    returnKeyType="done"
                    onSubmitEditing={() => setEditingName(false)}
                  />
                ) : (
                  <Text style={[styles.fieldValue, { color: colors.foreground }]}>
                    {name || '—'}
                  </Text>
                )}
              </View>
            </View>
            <TouchableOpacity
              onPress={() => setEditingName(e => !e)}
              style={[styles.editIconBtn, {
                backgroundColor: editingName ? colors.primary + '22' : colors.muted,
                borderColor: editingName ? colors.primary + '55' : colors.border,
              }]}
            >
              <Feather
                name={editingName ? 'check' : 'edit-2'}
                size={14}
                color={editingName ? colors.primary : colors.mutedForeground}
              />
            </TouchableOpacity>
          </View>

          {/* Free Fire UID field */}
          <View style={styles.fieldRow}>
            <View style={styles.fieldLeft}>
              <View style={[styles.iconWrap, { backgroundColor: colors.primary + '18' }]}>
                <Feather name="crosshair" size={15} color={colors.primary} />
              </View>
              <View style={styles.fieldContent}>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Free Fire UID</Text>
                {editingUid ? (
                  <TextInput
                    value={freeFireUid}
                    onChangeText={setFreeFireUid}
                    autoFocus
                    placeholder="Your Free Fire UID"
                    placeholderTextColor={colors.mutedForeground}
                    style={[styles.inlineInput, { color: colors.foreground, borderColor: colors.primary + '66' }]}
                    autoCapitalize="none"
                    keyboardType="default"
                    returnKeyType="done"
                    onSubmitEditing={() => setEditingUid(false)}
                  />
                ) : (
                  <Text style={[styles.fieldValue, { color: colors.foreground }]}>
                    {freeFireUid || '—'}
                  </Text>
                )}
              </View>
            </View>
            <TouchableOpacity
              onPress={() => setEditingUid(e => !e)}
              style={[styles.editIconBtn, {
                backgroundColor: editingUid ? colors.primary + '22' : colors.muted,
                borderColor: editingUid ? colors.primary + '55' : colors.border,
              }]}
            >
              <Feather
                name={editingUid ? 'check' : 'edit-2'}
                size={14}
                color={editingUid ? colors.primary : colors.mutedForeground}
              />
            </TouchableOpacity>
          </View>

        </View>

        {/* Save button */}
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: colors.primary }, saving && { opacity: 0.65 }]}
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
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, gap: 16 },

  card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },

  fieldRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', padding: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  fieldLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  fieldContent: { flex: 1, gap: 2 },
  fieldLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.4 },
  fieldValue: { fontSize: 15, fontWeight: '500' },
  inlineInput: {
    fontSize: 15, fontWeight: '500',
    borderBottomWidth: 1.5, paddingBottom: 2,
    paddingHorizontal: 0,
  },

  editIconBtn: {
    width: 32, height: 32, borderRadius: 8, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },

  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 17, borderRadius: 14,
  },
  saveBtnText: { fontSize: 15, fontWeight: '800', color: '#000', letterSpacing: 1 },
});
