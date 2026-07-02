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
import { AGE_CATEGORIES, DAY_LABELS, TASK_CATEGORIES } from '@/constants/data';
import { api } from '@/utils/api';
import { useToast } from '@/context/OverlayContext';
import PickerField from '@/components/PickerField';
import SelectSheet from '@/components/SelectSheet';
import type { AgeCategory, DayOfWeek, ScheduleSlot, TaskCategory, TaskItem, TimeSlot } from '@/types';

export default function ScheduleSlotFormScreen() {
  const router = useRouter();
  const showToast = useToast();
  const params = useLocalSearchParams<{ id?: string; ageCategory: AgeCategory; dayOfWeek: DayOfWeek }>();
  const isEdit = !!params.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [category, setCategory] = useState<TaskCategory | ''>('');
  const [timeId, setTimeId] = useState('');
  const [itemIds, setItemIds] = useState<string[]>([]);
  const [isAutomatic, setIsAutomatic] = useState(false);

  const [times, setTimes] = useState<TimeSlot[]>([]);
  const [items, setItems] = useState<TaskItem[]>([]);

  const [categorySheetVisible, setCategorySheetVisible] = useState(false);
  const [timeSheetVisible, setTimeSheetVisible] = useState(false);
  const [itemsSheetVisible, setItemsSheetVisible] = useState(false);

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
            setIsAutomatic(slot.is_automatic);
          }
        }
      } catch (e: any) {
        showToast(e.message || 'Kunne ikke hente data', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, [isEdit, params.id, params.ageCategory, params.dayOfWeek, showToast]);

  const categoryItems = useMemo(
    () => items.filter((i) => i.category === category),
    [items, category]
  );

  const handleSave = async () => {
    if (!category || !timeId) {
      showToast('Vælg venligst kategori og tidspunkt', 'error');
      return;
    }
    setSaving(true);
    const payload = {
      age_category: params.ageCategory,
      day_of_week: params.dayOfWeek,
      time_id: timeId,
      category,
      item_ids: itemIds,
      is_automatic: category === 'lys' ? isAutomatic : false,
    };
    try {
      if (isEdit) {
        await api.put(`/schedule-slots/${params.id}`, payload);
        showToast('Opgave opdateret', 'success');
      } else {
        await api.post('/schedule-slots', payload);
        showToast('Opgave tilføjet til ugeplan', 'success');
      }
      router.back();
    } catch (e: any) {
      showToast(e.message || 'Kunne ikke gemme opgave', 'error');
    } finally {
      setSaving(false);
    }
  };

  const ageLabel = AGE_CATEGORIES.find((a) => a.value === params.ageCategory)?.label;
  const dayLabel = DAY_LABELS[params.dayOfWeek];

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
        <Text style={styles.headerTitle}>{isEdit ? 'Rediger opgave' : 'Ny opgave'}</Text>
        <View style={{ width: 40 }} />
      </View>
      <Text style={styles.subHeader} testID="schedule-slot-form-context">
        {dayLabel} · {ageLabel}
      </Text>

      <ScrollView contentContainerStyle={styles.form}>
        <PickerField
          label="Kategori"
          value={TASK_CATEGORIES.find((c) => c.value === category)?.label || ''}
          placeholder="Vælg kategori"
          onPress={() => setCategorySheetVisible(true)}
          testID="schedule-slot-form-category-picker"
        />

        <PickerField
          label="Tidspunkt"
          value={times.find((t) => t.id === timeId)?.time || ''}
          placeholder={times.length === 0 ? 'Tilføj tider under Lister' : 'Vælg tidspunkt'}
          onPress={() => times.length > 0 && setTimeSheetVisible(true)}
          testID="schedule-slot-form-time-picker"
          icon="time-outline"
        />

        {category && (
          <PickerField
            label="Emner"
            value={itemIds.map((id) => items.find((i) => i.id === id)?.name).filter(Boolean).join(', ')}
            placeholder={categoryItems.length === 0 ? `Tilføj emner under Lister` : 'Vælg et eller flere emner'}
            onPress={() => categoryItems.length > 0 && setItemsSheetVisible(true)}
            testID="schedule-slot-form-items-picker"
          />
        )}

        {category === 'lys' && (
          <View style={styles.autoRow}>
            <Text style={styles.autoLabel}>Automatisk (ingen afkrydsning nødvendig)</Text>
            <View style={styles.autoOptions}>
              <TouchableOpacity
                style={[styles.autoOption, isAutomatic && styles.autoOptionActive]}
                onPress={() => setIsAutomatic(true)}
                testID="schedule-slot-form-automatic-option"
              >
                <Text style={[styles.autoOptionText, isAutomatic && styles.autoOptionTextActive]}>Automatisk</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.autoOption, !isAutomatic && styles.autoOptionActive]}
                onPress={() => setIsAutomatic(false)}
                testID="schedule-slot-form-manual-option"
              >
                <Text style={[styles.autoOptionText, !isAutomatic && styles.autoOptionTextActive]}>Manuel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
          testID="schedule-slot-form-save-button"
        >
          {saving ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.saveBtnText}>{isEdit ? 'Gem ændringer' : 'Tilføj opgave'}</Text>}
        </TouchableOpacity>
      </ScrollView>

      <SelectSheet
        visible={categorySheetVisible}
        title="Vælg kategori"
        options={TASK_CATEGORIES.map((c) => ({ value: c.value, label: c.label, icon: c.icon }))}
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
        title="Vælg tidspunkt"
        options={times.map((t) => ({ value: t.id, label: t.time }))}
        selected={timeId ? [timeId] : []}
        onSelect={(v) => setTimeId(v[0])}
        onClose={() => setTimeSheetVisible(false)}
        testIDPrefix="schedule-slot-form-time-sheet"
      />

      <SelectSheet
        visible={itemsSheetVisible}
        title="Vælg emner"
        multi
        options={categoryItems.map((i) => ({ value: i.id, label: i.name }))}
        selected={itemIds}
        onSelect={setItemIds}
        onClose={() => setItemsSheetVisible(false)}
        testIDPrefix="schedule-slot-form-items-sheet"
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
  autoRow: {
    marginBottom: 16,
  },
  autoLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  autoOptions: {
    flexDirection: 'row',
    gap: 10,
  },
  autoOption: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  autoOptionActive: {
    backgroundColor: COLORS.categories.lys.bg,
    borderColor: COLORS.categories.lys.bg,
  },
  autoOptionText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  autoOptionTextActive: {
    color: COLORS.white,
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
