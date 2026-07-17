import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { COLORS } from '@/constants/colors';
import { formatDateISO, isSameDay } from '@/constants/data';
import { formatFullDate } from '@/i18n/translations';
import { api } from '@/utils/api';
import { useToast } from '@/context/OverlayContext';
import { useAdminSettings } from '@/context/AdminSettingsContext';
import DragonColumn from '@/components/DragonColumn';
import PageBanner from '@/components/PageBanner';
import OverviewCalendarModal from '@/components/OverviewCalendarModal';
import type { DailyOverview } from '@/types';

const COLUMNS_HORIZONTAL_PADDING = 20;
const COLUMNS_GAP = 20;

export default function DagsoversigtScreen() {
  const router = useRouter();
  const showToast = useToast();
  const { width: screenWidth } = useWindowDimensions();
  // Always exactly one dragon column fills the available width (minus side
  // padding) - on wide/tablet screens this avoids peeking a 2nd column.
  const columnWidth = screenWidth - COLUMNS_HORIZONTAL_PADDING * 2;
  const { appBgColor, pageTitleColor, language, t } = useAdminSettings();
  const [date, setDate] = useState(new Date());
  const [overview, setOverview] = useState<DailyOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [calendarVisible, setCalendarVisible] = useState(false);

  const fetchOverview = useCallback(async (d: Date, showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      const data = await api.get(`/daily-overview?date=${formatDateISO(d)}`);
      setOverview(data);
    } catch (e: any) {
      showToast(e.message || t('overview.fetchError'), 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchOverview(date);
  }, [date, fetchOverview]);

  useFocusEffect(
    useCallback(() => {
      fetchOverview(date, false);
    }, [date, fetchOverview])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchOverview(date, false);
  };

  const changeDay = (offset: number) => {
    const next = new Date(date);
    next.setDate(next.getDate() + offset);
    setDate(next);
  };

  const goToday = () => setDate(new Date());

  const handleSelectCalendarDate = (d: Date) => {
    setDate(d);
    setCalendarVisible(false);
  };

  const toggleTask = async (dragonId: string, slotId: string) => {
    if (!overview) return;
    // optimistic update
    setOverview((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        dragons: prev.dragons.map((dr) =>
          dr.dragon_id === dragonId
            ? { ...dr, tasks: dr.tasks.map((t) => (t.slot_id === slotId ? { ...t, completed: !t.completed } : t)) }
            : dr
        ),
      };
    });
    try {
      await api.post('/completions/toggle', {
        dragon_id: dragonId,
        schedule_slot_id: slotId,
        date: formatDateISO(date),
      });
    } catch (e: any) {
      showToast(e.message || t('overview.updateError'), 'error');
      fetchOverview(date, false);
    }
  };

  const isToday = isSameDay(date, new Date());

  return (
    <SafeAreaView style={[styles.safeArea, appBgColor ? { backgroundColor: appBgColor } : null]} edges={['top']}>
      <PageBanner />
      <View style={styles.header}>
        <Text style={[styles.title, pageTitleColor ? { color: pageTitleColor } : null]}>{t('overview.title')}</Text>
        {!isToday && (
          <TouchableOpacity style={styles.todayBtn} onPress={goToday} testID="overview-today-button">
            <Text style={styles.todayBtnText}>{t('overview.today')}</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.dateNav}>
        <TouchableOpacity style={styles.navBtn} onPress={() => changeDay(-1)} testID="overview-prev-day-button">
          <Ionicons name="chevron-back" size={22} color={pageTitleColor || COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.dateNavCenter}>
          <Text style={[styles.navLabel, pageTitleColor ? { color: pageTitleColor } : null]}>
            {formatFullDate(date, language)}
          </Text>
          <TouchableOpacity
            style={styles.calendarBtn}
            onPress={() => setCalendarVisible(true)}
            testID="overview-calendar-button"
            accessibilityLabel={t('overview.calendarButton')}
          >
            <Ionicons name="calendar-outline" size={18} color={pageTitleColor || COLORS.primary} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.navBtn} onPress={() => changeDay(1)} testID="overview-next-day-button">
          <Ionicons name="chevron-forward" size={22} color={pageTitleColor || COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      {overview?.is_winter_period && (
        <View style={styles.winterBadge} testID="overview-winter-badge">
          <Ionicons name="snow-outline" size={14} color={COLORS.primaryDark} />
          <Text style={styles.winterBadgeText}>{t('admin.seasonWinterBadge')}</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator color={COLORS.primary} size="large" testID="overview-loading" />
        </View>
      ) : !overview || overview.dragons.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.centerBox}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <Ionicons name="paw-outline" size={48} color={COLORS.textMuted} />
          <Text style={styles.emptyTitle}>{t('overview.emptyTitle')}</Text>
          <Text style={styles.emptySubtitle}>{t('overview.emptySubtitle')}</Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => router.push('/dragon-form')}
            testID="overview-add-dragon-button"
          >
            <Text style={styles.addBtnText}>{t('overview.addDragon')}</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <ScrollView
          horizontal
          decelerationRate="fast"
          snapToInterval={overview.dragons.length > 1 ? columnWidth + COLUMNS_GAP : undefined}
          snapToAlignment="start"
          disableIntervalMomentum
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.columnsWrapper}
          testID="overview-columns-scroll"
        >
          {overview.dragons.map((dragon) => (
            <DragonColumn
              key={dragon.dragon_id}
              dragon={dragon}
              width={columnWidth}
              onToggleTask={(slotId) => toggleTask(dragon.dragon_id, slotId)}
              onActivityChanged={() => fetchOverview(date, false)}
            />
          ))}
        </ScrollView>
      )}

      <OverviewCalendarModal
        visible={calendarVisible}
        selectedDate={date}
        onClose={() => setCalendarVisible(false)}
        onSelectDate={handleSelectCalendarDate}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  todayBtn: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 4,
  },
  todayBtnText: {
    color: COLORS.primaryDark,
    fontWeight: '700',
    fontSize: 13,
  },
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginTop: 8,
    marginBottom: 12,
  },
  navBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'capitalize',
  },
  dateNavCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  calendarBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryLight,
  },
  winterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 12,
  },
  winterBadgeText: {
    color: COLORS.primaryDark,
    fontSize: 12,
    fontWeight: '700',
  },
  columnsWrapper: {
    paddingHorizontal: 20,
    gap: 20,
    paddingBottom: 20,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  addBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 14,
    marginTop: 12,
  },
  addBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 15,
  },
});
