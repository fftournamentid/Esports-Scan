import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { parseISTDateTime } from '@/utils/time';
import { useColors } from '@/hooks/useColors';

interface Props {
  targetDate: string;
  targetTime: string;
  onExpired?: () => void;
}

function formatUnit(n: number) {
  return n.toString().padStart(2, '0');
}

export default function CountdownTimer({ targetDate, targetTime, onExpired }: Props) {
  const colors = useColors();

  const getRemaining = () => {
    const diff = parseISTDateTime(targetDate, targetTime).getTime() - Date.now();
    if (diff <= 0) return null;
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return { h, m, s };
  };

  const [remaining, setRemaining] = useState(getRemaining());

  useEffect(() => {
    const interval = setInterval(() => {
      const r = getRemaining();
      setRemaining(r);
      if (!r) { clearInterval(interval); onExpired?.(); }
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDate, targetTime]);

  if (!remaining) {
    return (
      <View style={styles.row}>
        <Text style={[styles.label, { color: colors.live }]}>STARTED</Text>
      </View>
    );
  }

  return (
    <View style={styles.row}>
      {[{ v: remaining.h, l: 'H' }, { v: remaining.m, l: 'M' }, { v: remaining.s, l: 'S' }].map(
        ({ v, l }, i) => (
          <React.Fragment key={l}>
            {i > 0 && <Text style={[styles.sep, { color: colors.primary }]}>:</Text>}
            <View style={[styles.unit, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <Text style={[styles.num, { color: colors.primary }]}>{formatUnit(v)}</Text>
              <Text style={[styles.unitLabel, { color: colors.mutedForeground }]}>{l}</Text>
            </View>
          </React.Fragment>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  unit: { alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, minWidth: 40 },
  num: { fontSize: 18, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  unitLabel: { fontSize: 9, fontWeight: '600', marginTop: -2 },
  sep: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  label: { fontSize: 14, fontWeight: '700', letterSpacing: 2 },
});
