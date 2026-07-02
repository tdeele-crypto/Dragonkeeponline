import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/colors';
import { DAYS_OF_WEEK } from '@/constants/data';
import { AGE_CATEGORY_VALUES, getAgeLabel, getDayLabel } from '@/i18n/translations';
import { useAdminSettings } from '@/context/AdminSettingsContext';
import type { AgeCategory, DayOfWeek } from '@/types';

interface CopyToDaysSheetProps {
  visible: boolean;
  currentDay: DayOfWeek;
  currentAge: AgeCategory;
  selectedDays: DayOfWeek[];
  selectedAges: AgeCategory[];
  onToggleDay: (day: DayOfWeek) => void;
  onToggleAge: (age: AgeCategory) => void;
  onSelectAllDays: () => void;
  onSelectAllAges: () => void;
  onClose: () => void;
}

function Checkbox({ checked, disabled }: { checked: boolean; disabled?: boolean }) {
  return (
    <Ionicons
      name={checked ? 'checkbox' : 'square-outline'}
      size={22}
      color={disabled ? COLORS.textMuted : checked ? COLORS.primary : COLORS.textMuted}
    />
  );
}

export default function CopyToDaysSheet({
  visible,
  currentDay,
  currentAge,
  selectedDays,
  selectedAges,
  onToggleDay,
  onToggleAge,
  onSelectAllDays,
  onSelectAllAges,
  onClose,
}: CopyToDaysSheetProps) {
  const { language, t } = useAdminSettings();
  const allDaysSelected = selectedDays.length === DAYS_OF_WEEK.length - 1;
  const allAgesSelected = selectedAges.length === AGE_CATEGORY_VALUES.length - 1;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} testID="copy-to-days-backdrop" />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>{t('copyToDays.title')}</Text>
            <TouchableOpacity onPress={onClose} testID="copy-to-days-close-button" style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.subtitle}>
            {t('copyToDays.subtitle')}
          </Text>

          <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
            <View style={styles.groupHeader}>
              <Text style={styles.groupTitle}>{t('copyToDays.daysGroupTitle')}</Text>
              <TouchableOpacity onPress={onSelectAllDays} testID="copy-to-days-select-all-days">
                <Text style={styles.selectAllText}>{allDaysSelected ? t('copyToDays.deselectAll') : t('copyToDays.selectAll')}</Text>
              </TouchableOpacity>
            </View>
            {DAYS_OF_WEEK.map((day) => {
              const isCurrent = day === currentDay;
              const isChecked = isCurrent || selectedDays.includes(day);
              return (
                <TouchableOpacity
                  key={day}
                  style={[styles.option, isChecked && styles.optionSelected]}
                  onPress={() => onToggleDay(day)}
                  disabled={isCurrent}
                  testID={`copy-to-days-day-${day}`}
                >
                  <Checkbox checked={isChecked} disabled={isCurrent} />
                  <Text style={[styles.optionText, isChecked && styles.optionTextSelected]}>
                    {getDayLabel(day, language)}
                  </Text>
                  {isCurrent && <Text style={styles.currentTag}>{t('copyToDays.current')}</Text>}
                </TouchableOpacity>
              );
            })}

            <View style={styles.groupHeader}>
              <Text style={styles.groupTitle}>{t('copyToDays.agesGroupTitle')}</Text>
              <TouchableOpacity onPress={onSelectAllAges} testID="copy-to-days-select-all-ages">
                <Text style={styles.selectAllText}>{allAgesSelected ? t('copyToDays.deselectAll') : t('copyToDays.selectAll')}</Text>
              </TouchableOpacity>
            </View>
            {AGE_CATEGORY_VALUES.map((ageValue) => {
              const isCurrent = ageValue === currentAge;
              const isChecked = isCurrent || selectedAges.includes(ageValue);
              return (
                <TouchableOpacity
                  key={ageValue}
                  style={[styles.option, isChecked && styles.optionSelected]}
                  onPress={() => onToggleAge(ageValue)}
                  disabled={isCurrent}
                  testID={`copy-to-days-age-${ageValue}`}
                >
                  <Checkbox checked={isChecked} disabled={isCurrent} />
                  <Text style={[styles.optionText, isChecked && styles.optionTextSelected]}>{getAgeLabel(ageValue, language)}</Text>
                  {isCurrent && <Text style={styles.currentTag}>{t('copyToDays.current')}</Text>}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity style={styles.doneBtn} onPress={onClose} testID="copy-to-days-done-button">
            <Text style={styles.doneBtnText}>{t('copyToDays.done')}</Text>
          </TouchableOpacity>
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
    maxHeight: '80%',
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
    marginBottom: 4,
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
  subtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 17,
    marginBottom: 8,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 4,
  },
  groupTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  selectAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 48,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginVertical: 2,
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
  currentTag: {
    marginLeft: 'auto',
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primaryDark,
    textTransform: 'uppercase',
  },
  doneBtn: {
    marginTop: 14,
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
