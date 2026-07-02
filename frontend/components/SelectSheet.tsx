import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/colors';
import { useAdminSettings } from '@/context/AdminSettingsContext';

export interface SelectOption {
  value: string;
  label: string;
  icon?: string;
}

interface SelectSheetProps {
  visible: boolean;
  title: string;
  options: SelectOption[];
  selected: string[];
  multi?: boolean;
  onClose: () => void;
  onSelect: (values: string[]) => void;
  testIDPrefix?: string;
}

export default function SelectSheet({
  visible,
  title,
  options,
  selected,
  multi = false,
  onClose,
  onSelect,
  testIDPrefix = 'select-sheet',
}: SelectSheetProps) {
  const { t } = useAdminSettings();
  const toggle = (value: string) => {
    if (multi) {
      const next = selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value];
      onSelect(next);
    } else {
      onSelect([value]);
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} testID={`${testIDPrefix}-backdrop`} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} testID={`${testIDPrefix}-close-button`} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
            {options.length === 0 && (
              <Text style={styles.emptyText}>{t('selectSheet.empty')}</Text>
            )}
            {options.map((opt) => {
              const isSelected = selected.includes(opt.value);
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.option, isSelected && styles.optionSelected]}
                  onPress={() => toggle(opt.value)}
                  testID={`${testIDPrefix}-option-${opt.value}`}
                >
                  {opt.icon ? (
                    <Ionicons name={opt.icon as any} size={18} color={isSelected ? COLORS.primary : COLORS.textSecondary} />
                  ) : null}
                  <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>{opt.label}</Text>
                  {isSelected && <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} style={{ marginLeft: 'auto' }} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          {multi && (
            <TouchableOpacity style={styles.doneBtn} onPress={onClose} testID={`${testIDPrefix}-done-button`}>
              <Text style={styles.doneBtnText}>{t('copyToDays.done')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.overlay,
  },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    maxHeight: '75%',
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 14,
    paddingVertical: 20,
    textAlign: 'center',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 52,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginVertical: 3,
  },
  optionSelected: {
    backgroundColor: COLORS.primaryLight,
  },
  optionText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  optionTextSelected: {
    color: COLORS.primaryDark,
  },
  doneBtn: {
    marginTop: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 15,
  },
});
