import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { COLORS } from '@/constants/colors';
import { AGE_CATEGORIES, DAYS_OF_WEEK, DAY_LABELS, DAY_LABELS_SHORT } from '@/constants/data';
import { api } from '@/utils/api';
import { useConfirm, useToast } from '@/context/OverlayContext';
import { useAdminSettings } from '@/context/AdminSettingsContext';
import CategoryBadge from '@/components/CategoryBadge';
import PageBanner from '@/components/PageBanner';
import type { AgeCategory, DayOfWeek, ScheduleSlot, TaskItem, TimeSlot } from '@/types';

export default function ScheduleScreen() {
  const router = useRouter();
  const showToast = useToast();
  const showConfirm = useConfirm();
  const { appBgColor, pageTitleColor } = useAdminSettings();

  const [ageCategory, setAgeCategory] = useState<AgeCategory>('2-4');
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>('mandag');
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [times, setTimes] = useState<TimeSlot[]>([]);
  const [items, setItems] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      const [slotsData, timesData, itemsData] = await Promise.all([
        api.get(`/schedule-slots?age_category=${ageCategory}&day_of_week=${dayOfWeek}`),
        api.get('/times'),
        api.get('/task-items'),
      ]);
      setSlots(slotsData);
      setTimes(timesData);
      setItems(itemsData);
    } catch (e: any) {
      showToast(e.message || 'Kunne ikke hente ugeplan', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [ageCategory, dayOfWeek, showToast]);

  useFocusEffect(
    useCallback(() => {
      fetchData(true);
    }, [fetchData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData(false);
  };

  const timesMap = useMemo(() => new Map(times.map((t) => [t.id, t.time])), [times]);
  const itemsMap = useMemo(() => new Map(items.map((i) => [i.id, i.name])), [items]);

  const sortedSlots = useMemo(() => {
    return [...slots].sort((a, b) => {
      const ta = timesMap.get(a.time_id) || '';
      const tb = timesMap.get(b.time_id) || '';
      return ta.localeCompare(tb);
    });
  }, [slots, timesMap]);

  const handleDeleteSlot = (slot: ScheduleSlot) => {
    showConfirm({
      title: 'Slet opgave',
      message: 'Skal opgaven kun slettes for denne dag, eller for alle ugedage hvor samme opgave er oprettet på samme tidspunkt?',
      confirmLabel: 'Slet kun denne dag',
      secondaryLabel: 'Slet for alle ugedage',
      cancelLabel: 'Annuller',
      destructive: true,
      secondaryDestructive: true,
      onConfirm: async () => {
        try {
          await api.delete(`/schedule-slots/${slot.id}`);
          showToast('Opgave slettet', 'success');
          fetchData(false);
        } catch (e: any) {
          showToast(e.message || 'Kunne ikke slette opgave', 'error');
        }
      },
      onSecondaryConfirm: async () => {
        try {
          const res = await api.delete(`/schedule-slots/${slot.id}?all_days=true`);
          showToast(`Opgave slettet for ${res?.deleted_count || 'alle'} ugedage`, 'success');
          fetchData(false);
        } catch (e: any) {
          showToast(e.message || 'Kunne ikke slette opgave', 'error');
        }
      },
    });
  };

  return (
    <SafeAreaView style={[styles.safeArea, appBgColor ? { backgroundColor: appBgColor } : null]} edges={['top']}>
      <PageBanner />
      <View style={styles.header}>
        <Text style={[styles.title, pageTitleColor ? { color: pageTitleColor } : null]}>Ugeplaner</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
        style={styles.chipsScroll}
      >
        {AGE_CATEGORIES.map((age) => (
          <TouchableOpacity
            key={age.value}
            style={[styles.ageChip, ageCategory === age.value && styles.ageChipActive]}
            onPress={() => setAgeCategory(age.value)}
            testID={`schedule-age-chip-${age.value}`}
          >
            <Text style={[styles.ageChipText, ageCategory === age.value && styles.ageChipTextActive]}>
              {age.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
        style={styles.dayChipsScroll}
      >
        {DAYS_OF_WEEK.map((day) => (
          <TouchableOpacity
            key={day}
            style={[styles.dayChip, dayOfWeek === day && styles.dayChipActive]}
            onPress={() => setDayOfWeek(day)}
            testID={`schedule-day-chip-${day}`}
          >
            <Text style={[styles.dayChipText, dayOfWeek === day && styles.dayChipTextActive]}>
              {DAY_LABELS_SHORT[day]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.sectionLabel}>{DAY_LABELS[dayOfWeek]} · {AGE_CATEGORIES.find((a) => a.value === ageCategory)?.label}</Text>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator color={COLORS.primary} size="large" testID="schedule-loading" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {sortedSlots.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="calendar-outline" size={40} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>Ingen opgaver planlagt for denne dag endnu</Text>
            </View>
          ) : (
            sortedSlots.map((slot) => {
              const itemNames = slot.item_ids.map((id) => itemsMap.get(id)).filter(Boolean).join(' + ');
              return (
                <View key={slot.id} style={styles.slotCard} testID={`schedule-slot-card-${slot.id}`}>
                  <View style={styles.slotInfo}>
                    <Text style={styles.slotTime}>{timesMap.get(slot.time_id) || '??:??'}</Text>
                    <CategoryBadge category={slot.category} small />
                    {itemNames ? <Text style={styles.slotItems}>{itemNames}</Text> : null}
                    {slot.category === 'lys' && (
                      <Text style={styles.slotAuto}>{slot.is_automatic ? 'Automatisk' : 'Manuel'}</Text>
                    )}
                  </View>
                  <View style={styles.slotActions}>
                    <TouchableOpacity
                      style={styles.iconBtn}
                      onPress={() =>
                        router.push({
                          pathname: '/schedule-slot-form',
                          params: { id: slot.id, ageCategory, dayOfWeek },
                        })
                      }
                      testID={`schedule-slot-edit-button-${slot.id}`}
                    >
                      <Ionicons name="create-outline" size={19} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.iconBtn}
                      onPress={() => handleDeleteSlot(slot)}
                      testID={`schedule-slot-delete-button-${slot.id}`}
                    >
                      <Ionicons name="trash-outline" size={19} color={COLORS.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() =>
          router.push({ pathname: '/schedule-slot-form', params: { ageCategory, dayOfWeek } })
        }
        testID="add-schedule-slot-fab"
      >
        <Ionicons name="add" size={28} color={COLORS.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  chipsScroll: {
    flexGrow: 0,
    height: 48,
  },
  dayChipsScroll: {
    flexGrow: 0,
    height: 44,
    marginTop: 8,
  },
  chipsRow: {
    gap: 8,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  ageChip: {
    height: 36,
    borderRadius: 999,
    paddingHorizontal: 14,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    flexShrink: 0,
  },
  ageChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  ageChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  ageChipTextActive: {
    color: COLORS.white,
  },
  dayChip: {
    height: 32,
    borderRadius: 999,
    paddingHorizontal: 12,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    flexShrink: 0,
  },
  dayChipActive: {
    backgroundColor: '#D9D6D2',
    borderColor: '#B8B4AF',
  },
  dayChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  dayChipTextActive: {
    color: COLORS.textPrimary,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
    paddingHorizontal: 20,
    marginTop: 12,
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    padding: 20,
    paddingBottom: 100,
  },
  emptyBox: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 10,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 30,
  },
  slotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 10,
    gap: 10,
  },
  slotInfo: {
    flex: 1,
    gap: 6,
  },
  slotTime: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  slotItems: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  slotAuto: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
  },
  slotActions: {
    flexDirection: 'row',
    gap: 2,
  },
  iconBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});
