import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/colors';
import { DAYS_OF_WEEK, formatDateISO, isSameDay } from '@/constants/data';
import { getDayLabelShort, getMonthYearLabel } from '@/i18n/translations';
import { api } from '@/utils/api';
import { useAdminSettings } from '@/context/AdminSettingsContext';

type DayStatus = 'green' | 'yellow' | 'red' | 'none';

interface OverviewCalendarModalProps {
  visible: boolean;
  selectedDate: Date;
  dragonId?: string;
  dragonName?: string;
  onClose: () => void;
  onSelectDate: (date: Date) => void;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, delta: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + delta, 1);
}

const STATUS_COLORS: Record<DayStatus, string> = {
  green: COLORS.success,
  yellow: COLORS.categories.pleje.bg,
  red: COLORS.danger,
  none: COLORS.borderLight,
};

export default function OverviewCalendarModal({
  visible,
  selectedDate,
  dragonId,
  dragonName,
  onClose,
  onSelectDate,
}: OverviewCalendarModalProps) {
  const { language, t } = useAdminSettings();
  const [viewMonth, setViewMonth] = useState<Date>(() => startOfMonth(selectedDate));
  const [statusMap, setStatusMap] = useState<Record<string, DayStatus>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) setViewMonth(startOfMonth(selectedDate));
  }, [visible, selectedDate]);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    setLoading(true);
    const dragonParam = dragonId ? `&dragon_id=${encodeURIComponent(dragonId)}` : '';
    api
      .get(`/completions/calendar-summary?year=${viewMonth.getFullYear()}&month=${viewMonth.getMonth() + 1}${dragonParam}`)
      .then((data) => {
        if (cancelled) return;
        const map: Record<string, DayStatus> = {};
        (data?.days || []).forEach((d: any) => {
          map[d.date] = d.status;
        });
        setStatusMap(map);
      })
      .catch(() => {
        if (!cancelled) setStatusMap({});
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [visible, viewMonth, dragonId]);

  const today = useMemo(() => new Date(), []);

  const weeks = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // Monday-first index: JS getDay() is 0=Sunday..6=Saturday.
    const leadingBlanks = (firstOfMonth.getDay() + 6) % 7;

    const cells: (Date | null)[] = Array.from({ length: leadingBlanks }, () => null);
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push(new Date(year, month, day));
    }
    while (cells.length % 7 !== 0) cells.push(null);

    const rows: (Date | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      rows.push(cells.slice(i, i + 7));
    }
    return rows;
  }, [viewMonth]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} testID="overview-calendar-backdrop" />
        <View style={styles.sheet} testID="overview-calendar-modal">
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{t('overview.calendarTitle')}</Text>
              {!!dragonName && (
                <Text style={styles.subtitle} testID="overview-calendar-dragon-name">
                  {dragonName}
                </Text>
              )}
            </View>
            <TouchableOpacity onPress={onClose} testID="overview-calendar-close-button" style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.monthNav}>
            <TouchableOpacity
              onPress={() => setViewMonth((m) => addMonths(m, -1))}
              testID="overview-calendar-prev-month"
              style={styles.monthNavBtn}
            >
              <Ionicons name="chevron-back" size={20} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.monthLabel} testID="overview-calendar-month-label">
              {getMonthYearLabel(viewMonth, language)}
            </Text>
            <TouchableOpacity
              onPress={() => setViewMonth((m) => addMonths(m, 1))}
              testID="overview-calendar-next-month"
              style={styles.monthNavBtn}
            >
              <Ionicons name="chevron-forward" size={20} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.weekdayRow}>
            {DAYS_OF_WEEK.map((day) => (
              <Text key={day} style={styles.weekdayText}>
                {getDayLabelShort(day, language)}
              </Text>
            ))}
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={COLORS.primary} testID="overview-calendar-loading" />
            </View>
          ) : (
            <View testID="overview-calendar-grid">
              {weeks.map((row, rowIdx) => (
                <View key={rowIdx} style={styles.weekRow}>
                  {row.map((cellDate, colIdx) => {
                    if (!cellDate) return <View key={colIdx} style={styles.dayCell} />;
                    const dateStr = formatDateISO(cellDate);
                    const status = statusMap[dateStr] || 'none';
                    const isToday = isSameDay(cellDate, today);
                    const isSelected = isSameDay(cellDate, selectedDate);
                    return (
                      <TouchableOpacity
                        key={colIdx}
                        style={styles.dayCell}
                        onPress={() => onSelectDate(cellDate)}
                        testID={`overview-calendar-day-${dateStr}`}
                      >
                        <View
                          style={[
                            styles.dayCircle,
                            { backgroundColor: STATUS_COLORS[status] },
                            status === 'none' && styles.dayCircleNone,
                            isToday && styles.dayCircleToday,
                            isSelected && styles.dayCircleSelected,
                          ]}
                        >
                          <Text
                            style={[
                              styles.dayText,
                              status === 'none' ? styles.dayTextNone : styles.dayTextOnColor,
                            ]}
                          >
                            {cellDate.getDate()}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>
          )}

          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: STATUS_COLORS.green }]} />
              <Text style={styles.legendText}>{t('overview.calendarLegendDone')}</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: STATUS_COLORS.yellow }]} />
              <Text style={styles.legendText}>{t('overview.calendarLegendPartial')}</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: STATUS_COLORS.red }]} />
              <Text style={styles.legendText}>{t('overview.calendarLegendNone')}</Text>
            </View>
          </View>
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
    paddingBottom: 28,
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
  subtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  monthNavBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textTransform: 'capitalize',
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
  },
  loadingBox: {
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekRow: {
    flexDirection: 'row',
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  dayCircle: {
    width: '100%',
    height: '100%',
    maxWidth: 40,
    maxHeight: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleNone: {
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dayCircleToday: {
    borderWidth: 2,
    borderColor: COLORS.primaryDark,
  },
  dayCircleSelected: {
    borderWidth: 2,
    borderColor: COLORS.textPrimary,
  },
  dayText: {
    fontSize: 13,
    fontWeight: '700',
  },
  dayTextOnColor: {
    color: COLORS.white,
  },
  dayTextNone: {
    color: COLORS.textSecondary,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
});
