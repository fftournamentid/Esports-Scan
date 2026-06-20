import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import {
  Announcement,
  AnnouncementType,
  createAnnouncement,
  deleteAnnouncement,
  subscribeAnnouncements,
  updateAnnouncement,
} from '@/services/announcementService';

const TYPES: { value: AnnouncementType; label: string; color: string; icon: React.ComponentProps<typeof Feather>['name'] }[] = [
  { value: 'info',    label: 'Info',    color: '#4DA6FF', icon: 'info' },
  { value: 'event',   label: 'Event',   color: '#FF3B30', icon: 'zap' },
  { value: 'promo',   label: 'Promo',   color: '#FFD700', icon: 'gift' },
  { value: 'success', label: 'Update',  color: '#30D158', icon: 'check-circle' },
  { value: 'warning', label: 'Notice',  color: '#FF6B00', icon: 'alert-triangle' },
];

const BLANK = {
  title: '',
  message: '',
  type: 'info' as AnnouncementType,
  pinned: false,
  active: true,
};

export default function AnnouncementsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  useEffect(() => {
    const unsub = subscribeAnnouncements(setAnnouncements);
    return unsub;
  }, []);

  const openCreate = () => {
    setForm(BLANK);
    setEditing(null);
    setCreating(true);
  };

  const openEdit = (a: Announcement) => {
    setForm({ title: a.title, message: a.message, type: a.type, pinned: a.pinned, active: a.active });
    setEditing(a);
    setCreating(false);
  };

  const closeForm = () => { setCreating(false); setEditing(null); };

  const handleSave = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      Alert.alert('Missing Fields', 'Title and message are required.');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateAnnouncement(editing.id, form);
      } else {
        await createAnnouncement(form);
      }
      closeForm();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (a: Announcement) => {
    Alert.alert('Delete Announcement', `Delete "${a.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteAnnouncement(a.id) },
    ]);
  };

  const handleToggle = async (a: Announcement, field: 'active' | 'pinned') => {
    await updateAnnouncement(a.id, { [field]: !a[field] });
  };

  const showForm = creating || !!editing;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>ANNOUNCEMENTS</Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={showForm ? closeForm : openCreate}
        >
          <Feather name={showForm ? 'x' : 'plus'} size={16} color="#000" />
          <Text style={styles.addBtnText}>{showForm ? 'CANCEL' : 'NEW'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: Platform.OS === 'web' ? 40 : insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Create / Edit Form ── */}
        {showForm && (
          <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.primary + '44' }]}>
            <Text style={[styles.formTitle, { color: colors.primary }]}>
              {editing ? '✏️ Edit Announcement' : '📢 New Announcement'}
            </Text>

            <FormLabel label="TYPE" colors={colors} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeRow}>
              {TYPES.map(t => (
                <TouchableOpacity
                  key={t.value}
                  style={[
                    styles.typeChip,
                    {
                      backgroundColor: form.type === t.value ? t.color : colors.muted,
                      borderColor: form.type === t.value ? t.color : colors.border,
                    },
                  ]}
                  onPress={() => setForm(f => ({ ...f, type: t.value }))}
                >
                  <Feather name={t.icon} size={12} color={form.type === t.value ? '#000' : colors.mutedForeground} />
                  <Text style={[styles.typeChipText, { color: form.type === t.value ? '#000' : colors.mutedForeground }]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <FormLabel label="TITLE" colors={colors} />
            <TextInput
              style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground, borderColor: colors.border }]}
              placeholder="e.g. Weekend Mega Tournament — ₹5000 Prize Pool"
              placeholderTextColor={colors.mutedForeground}
              value={form.title}
              onChangeText={v => setForm(f => ({ ...f, title: v }))}
              maxLength={80}
            />

            <FormLabel label="MESSAGE" colors={colors} />
            <TextInput
              style={[styles.input, styles.textarea, { backgroundColor: colors.muted, color: colors.foreground, borderColor: colors.border }]}
              placeholder="Full announcement text visible to players…"
              placeholderTextColor={colors.mutedForeground}
              value={form.message}
              onChangeText={v => setForm(f => ({ ...f, message: v }))}
              multiline
              numberOfLines={3}
              maxLength={300}
            />

            <View style={styles.toggleRow}>
              <View style={styles.toggleItem}>
                <Feather name="eye" size={14} color={form.active ? colors.success : colors.mutedForeground} />
                <Text style={[styles.toggleLabel, { color: colors.foreground }]}>Active (visible to players)</Text>
                <Switch
                  value={form.active}
                  onValueChange={v => setForm(f => ({ ...f, active: v }))}
                  trackColor={{ false: colors.muted, true: colors.success + 'CC' }}
                  thumbColor={form.active ? colors.success : colors.mutedForeground}
                />
              </View>
              <View style={[styles.toggleItem, { borderTopColor: colors.border }]}>
                <Feather name="bookmark" size={14} color={form.pinned ? colors.primary : colors.mutedForeground} />
                <Text style={[styles.toggleLabel, { color: colors.foreground }]}>Pinned (always shows first)</Text>
                <Switch
                  value={form.pinned}
                  onValueChange={v => setForm(f => ({ ...f, pinned: v }))}
                  trackColor={{ false: colors.muted, true: colors.primary + 'CC' }}
                  thumbColor={form.pinned ? colors.primary : colors.mutedForeground}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: saving ? colors.muted : colors.primary }]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.85}
            >
              <Feather name={saving ? 'loader' : 'check'} size={16} color="#000" />
              <Text style={styles.saveBtnText}>{saving ? 'SAVING…' : editing ? 'SAVE CHANGES' : 'PUBLISH ANNOUNCEMENT'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Announcement List ── */}
        {announcements.length === 0 && !showForm ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="megaphone" size={36} color={colors.mutedForeground + '55'} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No announcements yet</Text>
            <Text style={[styles.emptyHint, { color: colors.border }]}>Tap NEW to create your first announcement</Text>
          </View>
        ) : (
          announcements.map(a => {
            const typeMeta = TYPES.find(t => t.value === a.type) ?? TYPES[0];
            const isExpired = !!a.expiresAt && new Date(a.expiresAt) < new Date();
            return (
              <View
                key={a.id}
                style={[
                  styles.announcementCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: a.active && !isExpired ? typeMeta.color + '55' : colors.border,
                    opacity: (!a.active || isExpired) ? 0.6 : 1,
                  },
                ]}
              >
                <View style={[styles.cardStrip, { backgroundColor: typeMeta.color }]} />
                <View style={styles.cardBody}>
                  <View style={styles.cardTop}>
                    <View style={styles.cardTopLeft}>
                      <View style={[styles.typePill, { backgroundColor: typeMeta.color + '20', borderColor: typeMeta.color + '44' }]}>
                        <Feather name={typeMeta.icon} size={10} color={typeMeta.color} />
                        <Text style={[styles.typePillText, { color: typeMeta.color }]}>{typeMeta.label.toUpperCase()}</Text>
                      </View>
                      {a.pinned && (
                        <View style={[styles.pinnedPill, { backgroundColor: colors.primary + '20', borderColor: colors.primary + '44' }]}>
                          <Feather name="bookmark" size={9} color={colors.primary} />
                          <Text style={[styles.pinnedText, { color: colors.primary }]}>PINNED</Text>
                        </View>
                      )}
                      {!a.active && (
                        <View style={[styles.pinnedPill, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                          <Text style={[styles.pinnedText, { color: colors.mutedForeground }]}>HIDDEN</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.cardActions}>
                      <TouchableOpacity
                        style={[styles.actionIcon, { backgroundColor: colors.accent + '18' }]}
                        onPress={() => openEdit(a)}
                      >
                        <Feather name="edit-2" size={14} color={colors.accent} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionIcon, { backgroundColor: colors.destructive + '18' }]}
                        onPress={() => handleDelete(a)}
                      >
                        <Feather name="trash-2" size={14} color={colors.destructive} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <Text style={[styles.cardTitle, { color: colors.foreground }]}>{a.title}</Text>
                  <Text style={[styles.cardMessage, { color: colors.mutedForeground }]} numberOfLines={2}>
                    {a.message}
                  </Text>

                  <View style={[styles.cardToggles, { borderTopColor: colors.border }]}>
                    <View style={styles.miniToggle}>
                      <Feather name="eye" size={12} color={a.active ? colors.success : colors.mutedForeground} />
                      <Text style={[styles.miniToggleText, { color: a.active ? colors.success : colors.mutedForeground }]}>
                        {a.active ? 'Visible' : 'Hidden'}
                      </Text>
                      <Switch
                        value={a.active}
                        onValueChange={() => handleToggle(a, 'active')}
                        trackColor={{ false: colors.muted, true: colors.success + 'CC' }}
                        thumbColor={a.active ? colors.success : colors.mutedForeground}
                        style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                      />
                    </View>
                    <View style={styles.miniToggle}>
                      <Feather name="bookmark" size={12} color={a.pinned ? colors.primary : colors.mutedForeground} />
                      <Text style={[styles.miniToggleText, { color: a.pinned ? colors.primary : colors.mutedForeground }]}>
                        {a.pinned ? 'Pinned' : 'Unpin'}
                      </Text>
                      <Switch
                        value={a.pinned}
                        onValueChange={() => handleToggle(a, 'pinned')}
                        trackColor={{ false: colors.muted, true: colors.primary + 'CC' }}
                        thumbColor={a.pinned ? colors.primary : colors.mutedForeground}
                        style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                      />
                    </View>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

function FormLabel({ label, colors }: { label: string; colors: ReturnType<typeof useColors> }) {
  return (
    <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>{label}</Text>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 10, borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 14, fontWeight: '700', letterSpacing: 2, flex: 1, textAlign: 'center' },
  backBtn: { padding: 8 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
  },
  addBtnText: { fontSize: 12, fontWeight: '800', color: '#000' },
  scroll: { paddingHorizontal: 16, paddingTop: 14, gap: 10 },

  formCard: { borderRadius: 16, borderWidth: 1, padding: 16 },
  formTitle: { fontSize: 15, fontWeight: '800', marginBottom: 14 },
  formLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, marginBottom: 6, marginTop: 12 },
  typeRow: { flexDirection: 'row', gap: 8, paddingBottom: 2 },
  typeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1,
  },
  typeChipText: { fontSize: 12, fontWeight: '700' },
  input: {
    borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14,
  },
  textarea: { height: 90, textAlignVertical: 'top' },
  toggleRow: { marginTop: 14, borderRadius: 10, overflow: 'hidden' },
  toggleItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 12, borderTopWidth: 1,
  },
  toggleLabel: { flex: 1, fontSize: 13 },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 12, marginTop: 16,
  },
  saveBtnText: { fontSize: 14, fontWeight: '800', color: '#000', letterSpacing: 0.5 },

  emptyCard: { borderRadius: 14, borderWidth: 1, padding: 40, alignItems: 'center', gap: 10 },
  emptyText: { fontSize: 15, fontWeight: '600' },
  emptyHint: { fontSize: 12, textAlign: 'center' },

  announcementCard: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  cardStrip: { height: 3 },
  cardBody: { padding: 14 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 },
  cardTopLeft: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  typePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5, borderWidth: 1,
  },
  typePillText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  pinnedPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5, borderWidth: 1,
  },
  pinnedText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  cardActions: { flexDirection: 'row', gap: 8 },
  actionIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 14, fontWeight: '800', marginBottom: 4 },
  cardMessage: { fontSize: 12, lineHeight: 17 },
  cardToggles: {
    flexDirection: 'row', gap: 0, marginTop: 12, paddingTop: 12, borderTopWidth: 1,
  },
  miniToggle: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  miniToggleText: { fontSize: 12, fontWeight: '600', flex: 1 },
});
