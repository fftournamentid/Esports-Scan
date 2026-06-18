import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useColors } from '@/hooks/useColors';

interface Option<T extends string> {
  label: string;
  value: T;
}

interface Props<T extends string> {
  label: string;
  options: Option<T>[];
  value: T;
  onChange: (val: T) => void;
  accentColor?: string;
}

export default function DropdownPicker<T extends string>({
  label,
  options,
  value,
  onChange,
  accentColor,
}: Props<T>) {
  const colors = useColors();
  const [open, setOpen] = useState(false);
  const accent = accentColor ?? colors.primary;
  const selected = options.find(o => o.value === value);

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        activeOpacity={0.8}
        style={[
          styles.trigger,
          { backgroundColor: colors.card, borderColor: open ? accent : colors.border },
        ]}
      >
        <Text style={[styles.triggerText, { color: colors.foreground }]}>
          {selected?.label ?? 'Select'}
        </Text>
        <Feather name="chevron-down" size={14} color={colors.mutedForeground} />
      </TouchableOpacity>

      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableWithoutFeedback onPress={() => setOpen(false)}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
        <View style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sheetLabel, { color: colors.mutedForeground }]}>{label}</Text>
          {options.map(opt => {
            const active = opt.value === value;
            return (
              <TouchableOpacity
                key={opt.value}
                onPress={() => { onChange(opt.value); setOpen(false); }}
                style={[
                  styles.option,
                  { borderBottomColor: colors.border },
                  active && { backgroundColor: accent + '18' },
                ]}
              >
                <Text style={[styles.optionText, { color: active ? accent : colors.foreground }]}>
                  {opt.label}
                </Text>
                {active && <Feather name="check" size={14} color={accent} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  label: { fontSize: 9, fontWeight: '600', letterSpacing: 1, marginBottom: 5 },
  trigger: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8,
  },
  triggerText: { fontSize: 13, fontWeight: '600', flex: 1 },
  overlay: { flex: 1, backgroundColor: '#00000055' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 18, borderTopRightRadius: 18,
    borderWidth: 1, paddingBottom: 32, paddingTop: 8,
  },
  sheetLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 1, paddingHorizontal: 20, paddingBottom: 8 },
  option: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1,
  },
  optionText: { fontSize: 15, fontWeight: '500' },
});
