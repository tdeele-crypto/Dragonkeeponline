import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { COLORS } from '@/constants/colors';
import { AGE_CATEGORIES, DAYS_OF_WEEK } from '@/constants/data';
import { getAgeLabel, getDayLabel, getTaskCategories, getCategoryLabel, formatTimeDisplay } from '@/i18n/translations';
import { api } from '@/utils/api';
import { useToast } from '@/context/OverlayContext';
import { useAdminSettings } from '@/context/AdminSettingsContext';
import PickerField from '@/components/PickerField';
import SelectSheet from '@/components/SelectSheet';
import CopyToDaysSheet from '@/components/CopyToDaysSheet';
import type { AgeCategory, DayOfWeek, ScheduleSlot, TaskCategory, TaskItem, TimeSlot } from '@/types';

export default function ScheduleSlotFormScreen() {
  const router = useRouter();
  const showToast = useToast();
  const { language, timeFormat, t } = useAdminSettings();
  const params = useLocalSearchParams<{ id?: string; ageCategory: AgeCategory; dayOfWeek: DayOfWeek }>();
  const isEdit = !!params.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [category, setCategory] = useState<TaskCategory | ''>('');
  const [timeId, setTimeId] = useState('');
  const [itemIds, setItemIds] = useState<string[]>([]);

  const [times, setTimes] = useState<TimeSlot[]>([]);
  const [items, setItems] = useState<TaskItem[]>([]);

  const [categorySheetVisible, setCategorySheetVisible] = useState(false);
  const [timeSheetVisible, setTimeSheetVisible] = useState(false);
  const [itemsSheetVisible, setItemsSheetVisible] = useState(false);
  const [copySheetVisible, setCopySheetVisible] = useState(false);
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([]);
  const [selectedAges, setSelectedAges] = useState<AgeCategory[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [timesData, itemsData] = await Promise.all([api.get('/times'), api.get('/task-items')]);
        setTimes(timesData);
        setItems(itemsData);

        if (isEdit) {
          const slots: ScheduleSlot[] = await api.get(
            `/schedule-slots?age_category=${params.ageCategory}&day_of_week=${params.dayOfWeek}`
          );
          const slot = slots.find((s) => s.id === params.id);
          if (slot) {
            setCategory(slot.category);
            setTimeId(slot.time_id);
            setItemIds(slot.item_ids);
          }
        }
      } catch (e: any) {
        showToast(e.message || t('slotForm.fetchError'), 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, [isEdit, params.id, params.ageCategory, params.dayOfWeek, showToast]);

  const categoryItems = useMemo(
    () => items.filter((i) => i.category === category),
    [items, category]
  );

  const selectedLysItems = useMemo(
    () => (category === 'lys' ? itemIds.map((id) => items.find((i) => i.id === id)).filter(Boolean) : []),
    [category, itemIds, items]
  ) as TaskItem[];

  const computedIsAutomatic =
    category === 'lys' && selectedLysItems.length > 0 && selectedLysItems.every((i) => i.is_automatic);

  const toggleCopyDay = (day: DayOfWeek) => {
    if (day === params.dayOfWeek) return;
    setSelectedDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  };

  const toggleCopyAge = (age: AgeCategory) => {
    if (age === params.ageCategory) return;
    setSelectedAges((prev) => (prev.includes(age) ? prev.filter((a) => a !== age) : [...prev, age]));
  };

  const selectAllDays = () => {
    setSelectedDays((prev) =>
      prev.length === DAYS_OF_WEEK.length - 1 ? [] : DAYS_OF_WEEK.filter((d) => d !== params.dayOfWeek)
    );
  };

  const selectAllAges = () => {
    setSelectedAges((prev) =>
      prev.length === AGE_CATEGORIES.length - 1
        ? []
        : AGE_CATEGORIES.map((a) => a.value).filter((a) => a !== params.ageCategory)
    );
  };

  const isCopying = selectedDays.length > 0 || selectedAges.length > 0;
  const daysToApply = Array.from(new Set([params.dayOfWeek, ...selectedDays]));
  const agesToApply = Array.from(new Set([params.ageCategory, ...selectedAges]));

  const handleSave = async () => {
    if (!category || !timeId) {
      showToast(t('slotForm.validationError'), 'error');
      return;
    }
    setSaving(true);
    const isAutomatic = category === 'lys' ? computedIsAutomatic : false;
    try {
      if (!isCopying) {
        const payload = {
          age_category: params.ageCategory,
          day_of_week: params.dayOfWeek,
          time_id: timeId,
          category,
          item_ids: itemIds,
          is_automatic: isAutomatic,
        };
        if (isEdit) {
          await api.put(`/schedule-slots/${params.id}`, payload);
          showToast(t('slotForm.updateSuccess'), 'success');
        } else {
          await api.post('/schedule-slots', payload);
          showToast(t('slotForm.addSuccess'), 'success');
        }
      } else {
        if (isEdit && params.id) {
          await api.delete(`/schedule-slots/${params.id}`);
        }
        await api.post('/schedule-slots/bulk-copy', {
          day_of_weeks: daysToApply,
          age_categories: agesToApply,
          time_id: timeId,
          category,
          item_ids: itemIds,
          is_automatic: isAutomatic,
        });
        showToast(t('slotForm.copySuccess', { d: daysToApply.length, p: agesToApply.length }), 'success');
      }
      router.back();
    } catch (e: any) {
      showToast(e.message || t('slotForm.saveError'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const ageLabel = getAgeLabel(params.ageCategory, language);
  const dayLabel = getDayLabel(params.dayOfWeek, language);

  if (loading) {
    return (
      <SafeAreaView style={styles.centerBox}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} testID="schedule-slot-form-close-button" style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEdit ? t('slotForm.editTitle') : t('slotForm.newTitle')}</Text>
        <View style={{ width: 40 }} />
      </View>
      <Text style={styles.subHeader} testID="schedule-slot-form-context">
        {dayLabel} · {ageLabel}
      </Text>

      <ScrollView contentContainerStyle={styles.form}>
        <PickerField
          label={t('slotForm.categoryLabel')}
          value={category ? getCategoryLabel(category, language) : ''}
          placeholder={t('slotForm.categoryPlaceholder')}
          onPress={() => setCategorySheetVisible(true)}
          testID="schedule-slot-form-category-picker"
        />

        <PickerField
          label={t('slotForm.timeLabel')}
          value={(() => {
            const timeStr = times.find((tm) => tm.id === timeId)?.time;
            return timeStr ? formatTimeDisplay(timeStr, timeFormat) : '';
          })()}
          placeholder={times.length === 0 ? t('slotForm.timeAddUnderLists') : t('slotForm.timePlaceholder')}
          onPress={() => times.length > 0 && setTimeSheetVisible(true)}
          testID="schedule-slot-form-time-picker"
          icon="time-outline"
        />

        {category && (
          <PickerField
            label={t('slotForm.itemsLabel')}
            value={itemIds.map((id) => items.find((i) => i.id === id)?.name).filter(Boolean).join(', ')}
            placeholder={categoryItems.length === 0 ? t('slotForm.itemsAddUnderLists') : t('slotForm.itemsPlaceholder')}
            onPress={() => categoryItems.length > 0 && setItemsSheetVisible(true)}
            testID="schedule-slot-form-items-picker"
          />
        )}

        {category === 'lys' && (
          <View
            style={[
              styles.autoInfoBox,
              computedIsAutomatic ? styles.autoInfoBoxAuto : styles.autoInfoBoxManual,
            ]}
            testID="schedule-slot-form-automatic-info"
          >
            <Ionicons
              name={computedIsAutomatic ? 'sync' : 'checkbox-outline'}
              size={16}
              color={computedIsAutomatic ? COLORS.categories.lys.text : COLORS.textSecondary}
            />
            <Text style={styles.autoInfoText}>
              {selectedLysItems.length === 0
                ? t('slotForm.autoInfoNone')
                : computedIsAutomatic
                ? t('slotForm.autoInfoAuto')
                : t('slotForm.autoInfoManual')}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.copyButton}
          onPress={() => setCopySheetVisible(true)}
          testID="schedule-slot-form-copy-button"
        >
          <Ionicons name="copy-outline" size={18} color={COLORS.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.copyButtonText}>{t('slotForm.copyButton')}</Text>
            {isCopying && (
              <Text style={styles.copyButtonSubtext}>
                {t('slotForm.copySubtext', {
                  d: daysToApply.length,
                  p: agesToApply.length,
                  total: daysToApply.length * agesToApply.length,
                })}
              </Text>
            )}
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
          testID="schedule-slot-form-save-button"
        >
          {saving ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.saveBtnText}>{isEdit ? t('slotForm.saveChanges') : t('slotForm.addTask')}</Text>}
        </TouchableOpacity>
      </ScrollView>

      <SelectSheet
        visible={categorySheetVisible}
        title={t('slotForm.selectCategoryTitle')}
        options={getTaskCategories(language)}
        selected={category ? [category] : []}
        onSelect={(v) => {
          const next = v[0] as TaskCategory;
          if (next !== category) setItemIds([]);
          setCategory(next);
        }}
        onClose={() => setCategorySheetVisible(false)}
        testIDPrefix="schedule-slot-form-category-sheet"
      />

      <SelectSheet
        visible={timeSheetVisible}
        title={t('slotForm.selectTimeTitle')}
        options={times.map((tm) => ({ value: tm.id, label: formatTimeDisplay(tm.time, timeFormat) }))}
        selected={timeId ? [timeId] : []}
        onSelect={(v) => setTimeId(v[0])}
        onClose={() => setTimeSheetVisible(false)}
        testIDPrefix="schedule-slot-form-time-sheet"
      />

      <SelectSheet
        visible={itemsSheetVisible}
        title={t('slotForm.selectItemsTitle')}
        multi
        options={categoryItems.map((i) => ({ value: i.id, label: i.name }))}
        selected={itemIds}
        onSelect={setItemIds}
        onClose={() => setItemsSheetVisible(false)}
        testIDPrefix="schedule-slot-form-items-sheet"
      />

      <CopyToDaysSheet
        visible={copySheetVisible}
        currentDay={params.dayOfWeek}
        currentAge={params.ageCategory}
        selectedDays={selectedDays}
        selectedAges={selectedAges}
        onToggleDay={toggleCopyDay}
        onToggleAge={toggleCopyAge}
        onSelectAllDays={selectAllDays}
        onSelectAllAges={selectAllAges}
        onClose={() => setCopySheetVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  subHeader: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'capitalize',
    marginTop: 2,
    marginBottom: 8,
  },
  form: {
    padding: 20,
    paddingBottom: 60,
  },
  autoInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  autoInfoBoxAuto: {
    backgroundColor: COLORS.categories.lys.light,
    borderColor: COLORS.categories.lys.border,
  },
  autoInfoBoxManual: {
    backgroundColor: COLORS.background,
    borderColor: COLORS.border,
  },
  autoInfoText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    lineHeight: 17,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    minHeight: 50,
  },
  copyButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  copyButtonSubtext: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primaryDark,
    marginTop: 2,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveBtnText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 16,
  },
});
