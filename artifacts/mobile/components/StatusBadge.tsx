import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { JoinStatus, TournamentStatus } from '@/context/TournamentContext';
import { useColors } from '@/hooks/useColors';

const TOURNAMENT_STATUS: Record<TournamentStatus, { label: string; color: string }> = {
  upcoming: { label: 'UPCOMING', color: '#4DA6FF' },
  live: { label: '🔴 LIVE', color: '#FF3B30' },
  completed: { label: 'COMPLETED', color: '#30D158' },
  closed: { label: 'CLOSED', color: '#8888AA' },
  cancelled: { label: 'CANCELLED', color: '#FF453A' },
};

const JOIN_STATUS: Record<JoinStatus, { label: string; color: string }> = {
  pending: { label: 'PENDING', color: '#F5A623' },
  approved: { label: 'APPROVED', color: '#30D158' },
  rejected: { label: 'REJECTED', color: '#FF453A' },
  room_released: { label: 'ROOM RELEASED', color: '#4DA6FF' },
  completed: { label: 'COMPLETED', color: '#8888AA' },
};

interface TournamentBadgeProps { type: 'tournament'; status: TournamentStatus }
interface JoinBadgeProps { type: 'join'; status: JoinStatus }
type Props = TournamentBadgeProps | JoinBadgeProps;

export default function StatusBadge(props: Props) {
  const colors = useColors();
  const { label, color } = props.type === 'tournament'
    ? TOURNAMENT_STATUS[props.status]
    : JOIN_STATUS[props.status];

  return (
    <View style={[styles.badge, { backgroundColor: color + '22', borderColor: color + '66' }]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, borderWidth: 1 },
  text: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
});
