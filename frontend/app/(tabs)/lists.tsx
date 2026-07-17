import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { COLORS } from '@/constants/colors';
import { formatTimeDisplay, getItemDisplayName } from '@/i18n/translations';
import { api } from '@/utils/api';
import { useConfirm, useToast } from '@/context/OverlayContext';
import { useAdminSettings } from '@/context/AdminSettingsContext';
import {
  getNotificationsEnabled,
  setNotificationsEnabled as persistNotificationsEnabled,
} from '@/utils/storage';
import {
  rescheduleAllNotifications,
  requestNotificationPermissions,
  cancelAllNotifications,
  isNotificationsAvailable,
} from '@/utils/notifications';
import PageBanner from '@/components/PageBanner';
import type { TaskItem, TimeSlot, Dragon, ScheduleSlot } from '@/types';

type ListKey = 'tider' | 'fodring' | 'pleje' | 'lys';

export default function ListsScreen() {
  const router = useRouter();
  const showToast = useToast();
  const showConfirm = useConfirm();
  const { appBgColor, pageTitleColor, language, timeFormat, t } = useAdminSettings();
  const [activeTab, setActiveTab] = useState<ListKey>('tider');

  const LIST_TABS: { key: ListKey; label: string; icon: string }[] = [
    { key: 'tider', label: t('tasks.tabTider'), icon: 'time-outline' },
    { key: 'fodring', label: t('tasks.tabFodring'), icon: 'leaf-outline' },
    { key: 'pleje', label: t('tasks.tabPleje'), icon: 'water-outline' },
    { key: 'lys', label: t('tasks.tabLys'), icon: 'sunny-outline' },
  ];
  const [times, setTimes] = useState<TimeSlot[]>([]);
  const [items, setItems] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notificationsEnabled, setNotificationsEnabledState] = useState(false);
  const [updatingNotifications, setUpdatingNotifications] = useState(false);

  const fetchData = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      const [timesData, itemsData] = await Promise.all([
        api.get('/times'),
        api.get('/task-items'),
      ]);
      setTimes(timesData);
      setItems(itemsData);
    } catch (e: any) {
      showToast(e.message || t('tasks.fetchError'), 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  useFocusEffect(
    useCallback(() => {
      fetchData(times.length === 0 && items.length === 0);
      getNotificationsEnabled().then(setNotificationsEnabledState);
    }, [fetchData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData(false);
  };

  const doRescheduleNotifications = async () => {
    const [dragons, slots, timesData, itemsData]: [Dragon[], ScheduleSlot[], TimeSlot[], TaskItem[]] =
      await Promise.all([api.get('/dragons'), api.get('/schedule-slots'), api.get('/times'), api.get('/task-items')]);
    await rescheduleAllNotifications(dragons, slots, timesData, itemsData);
  };

  const toggleNotifications = async (value: boolean) => {
    setUpdatingNotifications(true);
    try {
      if (value) {
        const available = await isNotificationsAvailable();
        if (!available) {
          showToast(t('tasks.notifDevBuildRequired'), 'error');
          setUpdatingNotifications(false);
          return;
        }
        const granted = await requestNotificationPermissions();
        if (!granted) {
          showToast(t('tasks.notifPermissionDenied'), 'error');
          setUpdatingNotifications(false);
          return;
        }
        await doRescheduleNotifications();
        showToast(t('tasks.notifEnabled'), 'success');
      } else {
        await cancelAllNotifications();
        showToast(t('tasks.notifDisabled'), 'success');
      }
      setNotificationsEnabledState(value);
      await persistNotificationsEnabled(value);
    } catch (e: any) {
      showToast(e.message || t('tasks.notifUpdateError'), 'error');
    } finally {
      setUpdatingNotifications(false);
    }
  };

  const handleDeleteTime = (time: TimeSlot) => {
    showConfirm({
      title: t('tasks.deleteTimeTitle', { time: formatTimeDisplay(time.time, timeFormat) }),
      confirmLabel: t('common.delete'),
      cancelLabel: t('common.cancel'),
      destructive: true,
      onConfirm: async () => {
        try {
          await api.delete(`/times/${time.id}`);
          showToast(t('tasks.timeDeletedSuccess'), 'success');
          fetchData(false);
        } catch (e: any) {
          showToast(e.message || t('tasks.timeDeleteError'), 'error');
        }
      },
    });
  };

  const handleDeleteItem = (item: TaskItem) => {
    showConfirm({
      title: t('tasks.deleteItemTitle', { name: getItemDisplayName(item, language) }),
      message: t('tasks.deleteItemMessage'),
      confirmLabel: t('common.delete'),
      cancelLabel: t('common.cancel'),
      destructive: true,
      onConfirm: async () => {
        try {
          await api.delete(`/task-items/${item.id}`);
          showToast(t('tasks.itemDeletedSuccess'), 'success');
          fetchData(false);
        } catch (e: any) {
          showToast(e.message || t('tasks.itemDeleteError'), 'error');
        }
      },
    });
  };

  const handleToggleItemAutomatic = async (item: TaskItem, value: boolean) => {
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, is_automatic: value } : i)));
    try {
      await api.put(`/task-items/${item.id}`, {
        category: item.category,
        name: item.name,
        is_automatic: value,
      });
    } catch (e: any) {
      showToast(e.message || t('tasks.autoUpdateError'), 'error');
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, is_automatic: !value } : i)));
    }
  };

  const filteredItems = items.filter((i) => i.category === activeTab);

  return (
    <SafeAreaView style={[styles.safeArea, appBgColor ? { backgroundColor: appBgColor } : null]} edges={['top']}>
      <PageBanner />
      <View style={styles.header}>
        <Text style={[styles.title, pageTitleColor ? { color: pageTitleColor } : null]}>{t('tasks.title')}</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsRow}
        style={styles.tabsScroll}
      >
        {LIST_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabChip, activeTab === tab.key && styles.tabChipActive]}
            onPress={() => setActiveTab(tab.key)}
            testID={`lists-tab-${tab.key}`}
          >
            <Ionicons
              name={tab.icon as any}
              size={15}
              color={activeTab === tab.key ? COLORS.white : COLORS.textSecondary}
            />
            <Text style={[styles.tabChipText, activeTab === tab.key && styles.tabChipTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator color={COLORS.primary} size="large" testID="lists-loading" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {activeTab === 'tider' ? (
            times.length === 0 ? (
              <Text style={styles.emptyText}>{t('tasks.emptyTimes')}</Text>
            ) : (
              <>
                <View style={styles.timeHeaderRow} testID="times-column-header">
                  <View style={{ width: 18 }} />
                  <Text style={[styles.timeHeaderText, { flex: 1 }]} />
                  <Text style={styles.timeHeaderText}>{t('tasks.winterColumnHeader')}</Text>
                  <View style={{ width: 36 + 36 }} />
                </View>
                {times.map((time) => (
                  <View key={time.id} style={styles.row} testID={`time-row-${time.id}`}>
                    <Ionicons name="time-outline" size={18} color={COLORS.textSecondary} />
                    <Text style={styles.rowText}>{formatTimeDisplay(time.time, timeFormat)}</Text>
                    {time.winter_time ? (
                      <View style={styles.winterBadge} testID={`time-winter-badge-${time.id}`}>
                        <Ionicons name="snow-outline" size={12} color={COLORS.primaryDark} />
                        <Text style={styles.winterBadgeText}>{formatTimeDisplay(time.winter_time, timeFormat)}</Text>
                      </View>
                    ) : (
                      <Text style={styles.winterAutoText} testID={`time-winter-auto-${time.id}`}>
                        {t('tasks.winterTimeAuto')}
                      </Text>
                    )}
                    <TouchableOpacity
                      onPress={() =>
                        router.push({
                          pathname: '/list-item-form',
                          params: {
                            category: 'tider',
                            id: time.id,
                            currentTime: time.time,
                            currentWinterTime: time.winter_time || '',
                          },
                        })
                      }
                      testID={`time-edit-button-${time.id}`}
                      style={styles.rowIconBtn}
                    >
                      <Ionicons name="create-outline" size={18} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteTime(time)} testID={`time-delete-button-${time.id}`} style={styles.rowIconBtn}>
                      <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
                    </TouchableOpacity>
                  </View>
                ))}
              </>
            )
          ) : filteredItems.length === 0 ? (
            <Text style={styles.emptyText}>{t('tasks.emptyItems')}</Text>
          ) : (
            filteredItems.map((item) => (
              <View key={item.id} style={styles.row} testID={`item-row-${item.id}`}>
                <Text style={styles.rowText}>{getItemDisplayName(item, language)}</Text>
                {item.category === 'lys' && (
                  <View style={styles.autoToggleGroup} testID={`item-automatic-group-${item.id}`}>
                    <Text style={styles.autoToggleLabel}>{t('tasks.automatic')}</Text>
                    <Switch
                      value={item.is_automatic}
                      onValueChange={(value) => handleToggleItemAutomatic(item, value)}
                      trackColor={{ false: COLORS.border, true: COLORS.categories.lys.bg }}
                      testID={`item-automatic-toggle-${item.id}`}
                    />
                  </View>
                )}
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: '/list-item-form',
                      params: {
                        category: item.category,
                        id: item.id,
                        currentName: getItemDisplayName(item, language),
                        currentAutomatic: String(item.is_automatic),
                      },
                    })
                  }
                  testID={`item-edit-button-${item.id}`}
                  style={styles.rowIconBtn}
                >
                  <Ionicons name="create-outline" size={18} color={COLORS.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteItem(item)} testID={`item-delete-button-${item.id}`} style={styles.rowIconBtn}>
                  <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
                </TouchableOpacity>
              </View>
            ))
          )}

          <View style={styles.settingsSection}>
            <Text style={styles.settingsTitle}>{t('tasks.settingsTitle')}</Text>
            <View style={styles.settingsRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.settingsLabel}>{t('tasks.remindersLabel')}</Text>
                <Text style={styles.settingsSubLabel}>{t('tasks.remindersSubLabel')}</Text>
              </View>
              {updatingNotifications ? (
                <ActivityIndicator color={COLORS.primary} />
              ) : (
                <Switch
                  value={notificationsEnabled}
                  onValueChange={toggleNotifications}
                  trackColor={{ false: COLORS.border, true: COLORS.success }}
                  testID="notifications-toggle"
                />
              )}
            </View>

            {activeTab === 'fodring' && (
              <TouchableOpacity
                style={styles.feedingSuggestionsBtn}
                onPress={() => router.push('/feeding-suggestions')}
                testID="feeding-suggestions-button"
              >
                <Ionicons name="restaurant-outline" size={18} color={COLORS.categories.fodring.text} />
                <Text style={styles.feedingSuggestionsBtnText}>{t('tasks.feedingSuggestionsButton')}</Text>
                <Ionicons name="chevron-forward" size={18} color={COLORS.categories.fodring.text} />
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push({ pathname: '/list-item-form', params: { category: activeTab } })}
        testID="add-list-item-fab"
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
  tabsScroll: {
    flexGrow: 0,
    height: 56,
  },
  tabsRow: {
    gap: 8,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  tabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    borderRadius: 999,
    paddingHorizontal: 14,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexShrink: 0,
  },
  tabChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  tabChipTextActive: {
    color: COLORS.white,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    padding: 20,
    paddingTop: 12,
    paddingBottom: 100,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 30,
  },
  timeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginBottom: 6,
  },
  timeHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    textAlign: 'center',
    minWidth: 78,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    minHeight: 52,
    marginBottom: 8,
  },
  rowText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  rowIconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  autoToggleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  autoToggleLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
  },
  winterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    minWidth: 78,
    justifyContent: 'center',
  },
  winterBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  winterAutoText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
    minWidth: 78,
    textAlign: 'center',
  },
  settingsSection: {
    marginTop: 24,
    backgroundColor: COLORS.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
  },
  settingsTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 12,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingsLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  settingsSubLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  feedingSuggestionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  feedingSuggestionsBtnText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.categories.fodring.text,
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
