import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '@/constants/colors';

/**
 * Web-only date/time field. `@react-native-community/datetimepicker` does not
 * work on react-native-web, so on web we render a native HTML <input> instead.
 *
 * IMPORTANT: only render this when Platform.OS === 'web'. On native the raw
 * <input> element is invalid and would crash. Callers guard with a
 * Platform.OS === 'web' check.
 */
interface Props {
  type: 'date' | 'time';
  value: string; // 'YYYY-MM-DD' for date, 'HH:MM' for time
  onChangeValue: (v: string) => void;
  label?: string;
  max?: string;
  testID?: string;
}

export default function WebDateInput({ type, value, onChangeValue, label, max, testID }: Props) {
  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      {/* @ts-expect-error DOM element rendered by react-native-web */}
      <input
        type={type}
        value={value}
        max={max}
        onChange={(e: any) => onChangeValue(e?.target?.value || '')}
        data-testid={testID}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          padding: '14px',
          fontSize: '16px',
          borderRadius: '12px',
          border: `1px solid ${COLORS.border}`,
          backgroundColor: COLORS.surface,
          color: COLORS.textPrimary,
          fontFamily: 'inherit',
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});
