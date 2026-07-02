import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/colors';

interface PickerFieldProps {
  label: string;
  value: string;
  placeholder?: string;
  onPress: () => void;
  testID: string;
  icon?: string;
}

export default function PickerField({ label, value, placeholder, onPress, testID, icon }: PickerFieldProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.field} onPress={onPress} testID={testID} activeOpacity={0.7}>
        {icon ? <Ionicons name={icon as any} size={18} color={COLORS.textSecondary} style={{ marginRight: 8 }} /> : null}
        <Text style={[styles.value, !value && styles.placeholder]} numberOfLines={1}>
          {value || placeholder || 'Vælg'}
        </Text>
        <Ionicons name="chevron-down" size={18} color={COLORS.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    minHeight: 50,
  },
  value: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  placeholder: {
    color: COLORS.textMuted,
    fontWeight: '400',
  },
});
