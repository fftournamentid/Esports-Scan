import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
import { JoinStatus, useTournament } from '@/context/TournamentContext';
import type { JoinedTournament } from '@/types';
import { subscribeTournamentRegistrations } from '@/services/registrationService';
import { useColors } from '@/hooks/useColors';
import { formatTimeIST, parseISTDateTime } from '@/utils/time';

function getRoomReleaseStatus(t: {
  roomId?: string;
  roomPassword?: string;
  roomReleaseTime?: string;
  roomAutoReleased?: boolean;
  repeatDaily: boolean;
  date: string;
  time: string;
  status: string;
}) {
  if (!t.roomId || !t.roomPassword) return 'no_room';
  if (t.roomReleaseTime) return 'released';
  if (t.roomId && t.roomPassword) {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const matchDate = t.repeatDaily ? today : t.date;
    const releaseMs = parseISTDateTime(matchDate, t.time).getTime() - 30 * 60 * 1000;
    const nowMs = Date.now();
    if (nowMs >= releaseMs) return 'pending_release';
    return 'waiting';
  }
  return 'no_room';
}

function formatReleaseTime(date: string, time: string, repeatDaily: boolean): string {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const matchDate = repeatDaily ? today : date;
  const releaseMs = parseISTDateTime(matchDate, time).getTime() - 30 * 60 * 1000;
  const releaseDate = new Date(releaseMs);
  const h = releaseDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' });
  return h.toUpperCase();
}

export default function RoomSettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getTournamentById, updateTournament, updateJoinStatus } = useTournament();

  const t = getTournamentById(id ?? '');
  const [roomId, setRoomId] = useState(t?.roomId ?? '');
  const [password, setPassword] = useState(t?.roomPassword ?? '');
  const [saving, setSaving] = useState(false);
  const [savedInfo, setSavedInfo] = useState<{ roomId: string; password: string; time: string } | null>(null);
  const [joins, setJoins] = useState<JoinedTournament[]>([]);

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  useEffect(() => {
    if (!id) return;
    const unsub = subscribeTournamentRegistrations(id, setJoins);
    return unsub;
  }, [id]);

  const handleRoomIdChange = (val: string) => setRoomId(val.replace(/[^0-9]/g, ''));

  const handleSave = async () => {
    if (!roomId.trim()) {
      Alert.alert('Error', 'Room ID is required (numbers only, e.g. 123456789)');
      return;
    }
    if (!/^\d+$/.test(roomId.trim())) {
      Alert.alert('Error', 'Room ID must contain numbers only');
      return;
    }
    if (!password.trim()) {
      Alert.alert('Error', 'Room Password is required');
      return;
    }
    setSaving(true);
    try {
      await updateTournament(id ?? '', { roomId: roomId.trim(), roomPassword: password.trim() });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const now = new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: true, timeZone: 'Asia/Kolkata',
      });
      setSavedInfo({ roomId: roomId.trim(), password: password.trim(), time: now.toUpperCase() });
    } finally {
      setSaving(false);
    }
  };

  const handleManualRelease = async () => {
    if (!roomId.trim() || !password.trim()) {
      Alert.alert('Error', 'Save Room ID and Password first');
      return;
    }
    Alert.alert(
      '⚡ Manual Release',
      'Manually release room now? (Auto-release normally happens 30 min before match)',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Release Now',
          onPress: async () => {
            await updateTournament(id ?? '', {
              status: 'live',
              roomId: roomId.trim(),
              roomPassword: password.trim(),
              roomReleaseTime: new Date().toISOString(),
              roomAutoReleased: true,
            });
            for (const j of joins.filter(j => j.status === 'approved' || j.status === 'pending')) {
              await updateJoinStatus(j.id, 'room_released');
            }
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('✅ Released', 'Room info now visible to approved players');
          },
        },
      ]
    );
  };

  const handleSetApproved = async (joinId: string) => {
    await updateJoinStatus(joinId, 'approved');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSetRejected = async (joinId: string) => {
    await updateJoinStatus(joinId, 'rejected');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSetPending = async (joinId: string) => {
    await updateJoinStatus(joinId, 'pending');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  if (!t) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPadding + 8 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>ROOM SETTINGS</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={styles.centered}>
          <Text style={{ color: colors.foreground }}>Tournament not found</Text>
        </View>
      </View>
    );
  }

  const releaseStatus = getRoomReleaseStatus(t);
  const pendingCount = joins.filter(j => j.status === 'pending').length;
  const approvedCount = joins.filter(j => j.status === 'approved' || j.status === 'room_released').length;
  const rejectedCount = joins.filter(j => j.status === 'rejected').length;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: topPadding + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>ROOM SETTINGS</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving} style={[styles.saveBtn, { backgroundColor: colors.primary }]}>
          <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>{saving ? '...' : 'SAVE'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[styles.tourneyName, { color: colors.foreground }]} numberOfLines={2}>{t.name}</Text>
        <Text style={[styles.tourneySub, { color: colors.mutedForeground }]}>
          {formatTimeIST(t.time)} IST · Auto-release at {formatReleaseTime(t.date, t.time, t.repeatDaily)}
        </Text>

        <View style={[styles.inputSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.fieldGroup}>
            <View style={styles.fieldLabelRow}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>ROOM ID</Text>
              <Text style={[styles.fieldHint, { color: colors.border }]}>Numbers only</Text>
            </View>
            <TextInput
              value={roomId}
              onChangeText={handleRoomIdChange}
              placeholder="e.g. 1239855988"
              placeholderTextColor={colors.mutedForeground + '55'}
              keyboardType="numeric"
              maxLength={20}
              style={[styles.input, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground }]}
            />
          </View>

          <View style={styles.fieldGroup}>
            <View style={styles.fieldLabelRow}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>ROOM PASSWORD</Text>
              <Text style={[styles.fieldHint, { color: colors.border }]}>Any characters · Any length</Text>
            </View>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="e.g. BOOYAH or FF2026 or X1"
              placeholderTextColor={colors.mutedForeground + '55'}
              autoCapitalize="none"
              autoCorrect={false}
              style={[styles.input, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground }]}
            />
          </View>
        </View>

        {savedInfo && (
          <View style={[styles.savedBanner, { backgroundColor: colors.success + '18', borderColor: colors.success + '44' }]}>
            <View style={styles.savedRow}>
              <Feather name="check-circle" size={16} color={colors.success} />
              <Text style={[styles.savedTitle, { color: colors.success }]}>Room settings saved successfully</Text>
            </View>
            <View style={styles.savedDetails}>
              <Text style={[styles.savedDetail, { color: colors.mutedForeground }]}>Room ID: <Text style={{ color: colors.foreground, fontWeight: '700' }}>{savedInfo.roomId}</Text></Text>
              <Text style={[styles.savedDetail, { color: colors.mutedForeground }]}>Password: <Text style={{ color: colors.foreground, fontWeight: '700' }}>{savedInfo.password}</Text></Text>
              <Text style={[styles.savedDetail, { color: colors.mutedForeground }]}>Last Updated: <Text style={{ color: colors.foreground }}>{savedInfo.time} IST</Text></Text>
            </View>
          </View>
        )}

        <View style={[styles.releaseStatusCard, {
          backgroundColor: releaseStatus === 'released' ? colors.success + '18' :
            releaseStatus === 'waiting' ? colors.primary + '18' :
              releaseStatus === 'pending_release' ? colors.live + '18' : colors.muted,
          borderColor: releaseStatus === 'released' ? colors.success + '44' :
            releaseStatus === 'waiting' ? colors.primary + '44' :
              releaseStatus === 'pending_release' ? colors.live + '44' : colors.border,
        }]}>
          <View style={styles.releaseStatusRow}>
            <Feather
              name={releaseStatus === 'released' ? 'unlock' : releaseStatus === 'no_room' ? 'lock' : 'clock'}
              size={16}
              color={releaseStatus === 'released' ? colors.success : releaseStatus === 'waiting' ? colors.primary : colors.live}
            />
            <Text style={[styles.releaseStatusLabel, {
              color: releaseStatus === 'released' ? colors.success :
                releaseStatus === 'no_room' ? colors.mutedForeground : colors.primary,
            }]}>
              {releaseStatus === 'no_room' && 'NO ROOM SAVED — Enter Room ID & Password above'}
              {releaseStatus === 'waiting' && `WAITING FOR AUTO-RELEASE — At ${formatReleaseTime(t.date, t.time, t.repeatDaily)} IST`}
              {releaseStatus === 'pending_release' && 'PENDING AUTO-RELEASE — Will release shortly'}
              {releaseStatus === 'released' && `RELEASED — ${t.roomReleaseTime ? new Date(t.roomReleaseTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' }).toUpperCase() : ''} IST`}
            </Text>
          </View>
          {t.roomId && t.roomPassword && releaseStatus !== 'no_room' && (
            <View style={styles.savedRoomPreview}>
              <Text style={[styles.savedRoomText, { color: colors.mutedForeground }]}>
                ID: <Text style={{ color: colors.foreground }}>{t.roomId}</Text>  ·  Pass: <Text style={{ color: colors.foreground }}>{t.roomPassword}</Text>
              </Text>
            </View>
          )}
        </View>

        {releaseStatus !== 'released' && t.roomId && t.roomPassword && (
          <TouchableOpacity style={[styles.manualReleaseBtn, { backgroundColor: colors.live + '22', borderColor: colors.live + '55' }]} onPress={handleManualRelease}>
            <Feather name="zap" size={14} color={colors.live} />
            <Text style={[styles.manualReleaseBtnText, { color: colors.live }]}>EMERGENCY: RELEASE ROOM NOW</Text>
          </TouchableOpacity>
        )}

        <View style={[styles.playerStats, { borderColor: colors.border }]}>
          <View style={styles.playerStat}>
            <Text style={[styles.playerStatNum, { color: colors.mutedForeground }]}>{joins.length}</Text>
            <Text style={[styles.playerStatLabel, { color: colors.border }]}>TOTAL</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.playerStat}>
            <Text style={[styles.playerStatNum, { color: colors.primary }]}>{pendingCount}</Text>
            <Text style={[styles.playerStatLabel, { color: colors.border }]}>PENDING</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.playerStat}>
            <Text style={[styles.playerStatNum, { color: colors.success }]}>{approvedCount}</Text>
            <Text style={[styles.playerStatLabel, { color: colors.border }]}>APPROVED</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.playerStat}>
            <Text style={[styles.playerStatNum, { color: colors.destructive }]}>{rejectedCount}</Text>
            <Text style={[styles.playerStatLabel, { color: colors.border }]}>REJECTED</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Players ({joins.length})</Text>

        {joins.length === 0 ? (
          <View style={[styles.emptyPlayers, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="users" size={32} color={colors.border} />
            <Text style={[styles.emptyPlayersText, { color: colors.mutedForeground }]}>No players joined yet</Text>
          </View>
        ) : (
          joins.map(j => {
            const isPending = j.status === 'pending';
            const isApproved = j.status === 'approved' || j.status === 'room_released';
            const isRejected = j.status === 'rejected';

            return (
              <View key={j.id} style={[styles.playerCard, { backgroundColor: colors.card, borderColor: isApproved ? colors.success + '44' : isRejected ? colors.destructive + '44' : colors.border }]}>
                <View style={[styles.playerStatusStrip, {
                  backgroundColor: isApproved ? colors.success : isRejected ? colors.destructive : colors.primary,
                }]} />

                <View style={styles.playerCardInner}>
                  <View style={styles.playerInfo}>
                    <Text style={[styles.playerName, { color: colors.foreground }]}>{j.playerName}</Text>
                    <View style={styles.playerDetailRow}>
                      <Feather name="shield" size={11} color={colors.mutedForeground} />
                      <Text style={[styles.playerDetail, { color: colors.mutedForeground }]}>UID: {j.uid}</Text>
                    </View>
                    <View style={styles.playerDetailRow}>
                      <Feather name="hash" size={11} color={colors.primary} />
                      <Text style={[styles.playerDetail, { color: j.transactionId ? colors.foreground : colors.destructive, fontWeight: j.transactionId ? '600' : '400' }]}>
                        UTR: {j.transactionId || 'Not provided'}
                      </Text>
                    </View>
                    <Text style={[styles.joinedAt, { color: colors.border }]}>
                      Joined: {new Date(j.joinedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })} IST
                    </Text>
                  </View>

                  <View style={styles.approvalActions}>
                    <View style={[styles.statusChip, {
                      backgroundColor: isApproved ? colors.success + '22' : isRejected ? colors.destructive + '22' : colors.primary + '22',
                      borderColor: isApproved ? colors.success + '55' : isRejected ? colors.destructive + '55' : colors.primary + '55',
                    }]}>
                      <Text style={[styles.statusChipText, {
                        color: isApproved ? colors.success : isRejected ? colors.destructive : colors.primary,
                      }]}>
                        {isApproved ? (j.status === 'room_released' ? 'ROOM SENT' : 'APPROVED') : isRejected ? 'REJECTED' : 'PENDING'}
                      </Text>
                    </View>

                    <View style={styles.actionBtns}>
                      {!isApproved && (
                        <TouchableOpacity
                          onPress={() => handleSetApproved(j.id)}
                          style={[styles.actionBtn, { backgroundColor: colors.success + '22', borderColor: colors.success + '55' }]}
                        >
                          <Feather name="check" size={13} color={colors.success} />
                          <Text style={[styles.actionBtnText, { color: colors.success }]}>Approve</Text>
                        </TouchableOpacity>
                      )}
                      {!isRejected && (
                        <TouchableOpacity
                          onPress={() => handleSetRejected(j.id)}
                          style={[styles.actionBtn, { backgroundColor: colors.destructive + '18', borderColor: colors.destructive + '44' }]}
                        >
                          <Feather name="x" size={13} color={colors.destructive} />
                          <Text style={[styles.actionBtnText, { color: colors.destructive }]}>Reject</Text>
                        </TouchableOpacity>
                      )}
                      {(isApproved || isRejected) && (
                        <TouchableOpacity
                          onPress={() => handleSetPending(j.id)}
                          style={[styles.actionBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
                        >
                          <Feather name="rotate-ccw" size={12} color={colors.mutedForeground} />
                          <Text style={[styles.actionBtnText, { color: colors.mutedForeground }]}>Undo</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            );
          })
        )}

        <View style={{ height: 30 }} />
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
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 16, paddingBottom: 20, gap: 12 },
  tourneyName: { fontSize: 16, fontWeight: '700', marginTop: 4, lineHeight: 22 },
  tourneySub: { fontSize: 12, marginTop: -4 },
  inputSection: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 14 },
  fieldGroup: { gap: 6 },
  fieldLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 10, fontWeight: '600', letterSpacing: 1 },
  fieldHint: { fontSize: 10 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 15, letterSpacing: 1 },
  savedBanner: { borderRadius: 12, borderWidth: 1, padding: 12, gap: 8 },
  savedRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  savedTitle: { fontSize: 13, fontWeight: '700' },
  savedDetails: { gap: 3, paddingLeft: 24 },
  savedDetail: { fontSize: 12 },
  releaseStatusCard: { borderRadius: 12, borderWidth: 1, padding: 12, gap: 6 },
  releaseStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  releaseStatusLabel: { fontSize: 11, fontWeight: '700', flex: 1, lineHeight: 16 },
  savedRoomPreview: { paddingLeft: 24 },
  savedRoomText: { fontSize: 12 },
  manualReleaseBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, borderRadius: 10, borderWidth: 1 },
  manualReleaseBtnText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  playerStats: { flexDirection: 'row', borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  playerStat: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  playerStatNum: { fontSize: 20, fontWeight: '700' },
  playerStatLabel: { fontSize: 9, fontWeight: '600', letterSpacing: 0.5 },
  statDivider: { width: 1 },
  sectionTitle: { fontSize: 14, fontWeight: '700' },
  emptyPlayers: { borderRadius: 12, borderWidth: 1, padding: 30, alignItems: 'center', gap: 10 },
  emptyPlayersText: { fontSize: 13 },
  playerCard: { borderRadius: 12, borderWidth: 1, overflow: 'hidden', flexDirection: 'row' },
  playerStatusStrip: { width: 4 },
  playerCardInner: { flex: 1, padding: 12, gap: 10 },
  playerInfo: { gap: 4 },
  playerName: { fontSize: 14, fontWeight: '700' },
  playerDetailRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  playerDetail: { fontSize: 11, flex: 1 },
  joinedAt: { fontSize: 10, marginTop: 2 },
  approvalActions: { gap: 8 },
  statusChip: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, borderWidth: 1 },
  statusChipText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  actionBtns: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  actionBtnText: { fontSize: 11, fontWeight: '600' },
});
