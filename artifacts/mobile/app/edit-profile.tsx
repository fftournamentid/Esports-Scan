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
import { getProfileCompletion } from '@/utils/profileCompletion';

type IconName = React.ComponentProps<typeof Feather>['name'];

interface FieldConfig {
  key: 'name' | 'freeFireUid' | 'phoneNumber' | 'upiId' | 'whatsappNumber';
  label: string;
  icon: IconName;
  placeholder: string;
  keyboardType: 'default' | 'phone-pad' | 'decimal-pad';
  autoCapitalize: 'none' | 'words' | 'characters';
  required: boolean;
}

const FIELDS: FieldConfig[] = [
  { key: 'name', label: 'Player Name', icon: 'user', placeholder: 'Your name', keyboardType: 'default', autoCapitalize: 'words', required: true },
  { key: 'freeFireUid', label: 'Free Fire UID', icon: 'crosshair', placeholder: 'Your Free Fire UID', keyboardType: 'default', autoCapitalize: 'none', required: true },
  { key: 'phoneNumber', label: 'Phone Number', icon: 'phone', placeholder: '+91 9876543210', keyboardType: 'phone-pad', autoCapitalize: 'none', required: false },
  { key: 'upiId', label: 'UPI ID', icon: 'credit-card', placeholder: 'yourname@upi', keyboardType: 'default', autoCapitalize: 'none', required: false },
  { key: 'whatsappNumber', label: 'WhatsApp Number', icon: 'message-circle', placeholder: '+91 9876543210', keyboardType: 'phone-pad', autoCapitalize: 'none', required: false },
];

export default function EditProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { firebaseUser, userProfile, refreshProfile } = useAuth();
  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  const [values, setValues] = useState<Record<string, string>>({
    name: '',
    freeFireUid: '',
    phoneNumber: '',
    upiId: '',
    whatsappNumber: '',
  });
  const [editingField, setEditingField] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setValues({
        name: userProfile.name ?? '',
        freeFireUid: userProfile.freeFireUid ?? '',
        phoneNumber: userProfile.phoneNumber ?? '',
        upiId: userProfile.upiId ?? '',
        whatsappNumber: userProfile.whatsappNumber ?? '',
      });
    }
  }, [userProfile]);

  // Build a temporary profile for completion preview
  const tempProfile = userProfile ? {
    ...userProfile,
    name: values.name,
    freeFireUid: values.freeFireUid,
    phoneNumber: values.phoneNumber,
    upiId: values.upiId,
    whatsappNumber: values.whatsappNumber,
  } : null;
  const completion = getProfileCompletion(tempProfile);

  const handleSave = async () => {
    if (!firebaseUser) return;
    if (!values.name.trim()) {
      Alert.alert('Name Required', 'Please enter your player name.');
      return;
    }
    setEditingField(null);
    setSaving(true);
    try {
      await updateUserProfile(firebaseUser.uid, {
        name: values.name,
        freeFireUid: values.freeFireUid,
        phoneNumber: values.phoneNumber,
        upiId: values.upiId,
        whatsappNumber: values.whatsappNumber,
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

  const barWidth = `${completion.percentage}%` as `${number}%`;
  const barColor = completion.canJoin ? colors.success : colors.primary;

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
        {/* Completion progress card */}
        <View style={[styles.completionCard, { backgroundColor: colors.card, borderColor: completion.canJoin ? colors.success + '55' : colors.primary + '44' }]}>
          <View style={styles.completionHeader}>
            <Text style={[styles.completionLabel, { color: colors.mutedForeground }]}>PROFILE COMPLETION</Text>
            <Text style={[styles.completionPct, { color: barColor }]}>{completion.percentage}%</Text>
          </View>
          <View style={[styles.barBg, { backgroundColor: colors.muted }]}>
            <View style={[styles.barFill, { width: barWidth, backgroundColor: barColor }]} />
          </View>
          <Text style={[styles.completionSub, { color: completion.canJoin ? colors.success : colors.mutedForeground }]}>
            {completion.completed} of {completion.total} fields completed
            {completion.canJoin ? ' — Tournament joining unlocked ✓' : ` — Need ${5 - completion.completed} more to join`}
          </Text>
          {!completion.canJoin && completion.missingFields.length > 0 && (
            <View style={styles.missingList}>
              {completion.missingFields.map(f => (
                <View key={f} style={styles.missingItem}>
                  <Feather name="alert-circle" size={12} color={colors.destructive} />
                  <Text style={[styles.missingText, { color: colors.destructive }]}>{f}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Email (read-only) */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.fieldRow, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
            <View style={styles.fieldLeft}>
              <View style={[styles.iconWrap, { backgroundColor: colors.primary + '18' }]}>
                <Feather name="mail" size={15} color={colors.primary} />
              </View>
              <View style={styles.fieldContent}>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Email</Text>
                <Text style={[styles.fieldValue, { color: colors.mutedForeground }]}>
                  {userProfile?.email || firebaseUser?.email || '—'}
                </Text>
              </View>
            </View>
            <View style={[styles.editIconBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <Feather name="lock" size={13} color={colors.mutedForeground} />
            </View>
          </View>

          {/* Editable fields */}
          {FIELDS.map((field, i) => {
            const isEditing = editingField === field.key;
            const isLast = i === FIELDS.length - 1;
            const isEmpty = !values[field.key]?.trim();
            return (
              <View
                key={field.key}
                style={[styles.fieldRow, !isLast && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}
              >
                <View style={styles.fieldLeft}>
                  <View style={[styles.iconWrap, {
                    backgroundColor: isEmpty && !field.required
                      ? colors.destructive + '11'
                      : colors.primary + '18',
                  }]}>
                    <Feather
                      name={field.icon}
                      size={15}
                      color={isEmpty && !field.required ? colors.destructive : colors.primary}
                    />
                  </View>
                  <View style={styles.fieldContent}>
                    <View style={styles.labelRow}>
                      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{field.label}</Text>
                      {!field.required && (
                        <Text style={[styles.optionalBadge, { color: colors.border }]}>optional</Text>
                      )}
                    </View>
                    {isEditing ? (
                      <TextInput
                        value={values[field.key]}
                        onChangeText={v => setValues(prev => ({ ...prev, [field.key]: v }))}
                        autoFocus
                        placeholder={field.placeholder}
                        placeholderTextColor={colors.mutedForeground}
                        style={[styles.inlineInput, { color: colors.foreground, borderColor: colors.primary + '66' }]}
                        autoCapitalize={field.autoCapitalize}
                        keyboardType={field.keyboardType}
                        returnKeyType="done"
                        onSubmitEditing={() => setEditingField(null)}
                      />
                    ) : (
                      <Text style={[styles.fieldValue, { color: isEmpty ? colors.mutedForeground : colors.foreground }]}>
                        {values[field.key] || `Add ${field.label}`}
                      </Text>
                    )}
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => setEditingField(isEditing ? null : field.key)}
                  style={[styles.editIconBtn, {
                    backgroundColor: isEditing ? colors.primary + '22' : colors.muted,
                    borderColor: isEditing ? colors.primary + '55' : colors.border,
                  }]}
                >
                  <Feather
                    name={isEditing ? 'check' : 'edit-2'}
                    size={14}
                    color={isEditing ? colors.primary : colors.mutedForeground}
                  />
                </TouchableOpacity>
              </View>
            );
          })}
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
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, gap: 14 },

  completionCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 8 },
  completionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  completionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  completionPct: { fontSize: 22, fontWeight: '800' },
  barBg: { height: 8, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  completionSub: { fontSize: 12, fontWeight: '500' },
  missingList: { gap: 4, marginTop: 2 },
  missingItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  missingText: { fontSize: 12 },

  card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  fieldRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', padding: 14,
    gap: 12,
  },
  fieldLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  fieldContent: { flex: 1, gap: 2 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  fieldLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.4 },
  optionalBadge: { fontSize: 10 },
  fieldValue: { fontSize: 14, fontWeight: '500' },
  inlineInput: {
    fontSize: 14, fontWeight: '500',
    borderBottomWidth: 1.5, paddingBottom: 2,
    paddingHorizontal: 0,
  },
  editIconBtn: {
    width: 32, height: 32, borderRadius: 8, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 17, borderRadius: 14,
  },
  saveBtnText: { fontSize: 15, fontWeight: '800', color: '#000', letterSpacing: 1 },
});
