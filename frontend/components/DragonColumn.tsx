import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DragonAvatar from '@/components/DragonAvatar';
import TaskRow from '@/components/TaskRow';
import { COLORS } from '@/constants/colors';
import { getAgeLabel } from '@/i18n/translations';
import { useAdminSettings } from '@/context/AdminSettingsContext';
import { useToast } from '@/context/OverlayContext';
import { api } from '@/utils/api';
import type { OverviewDragon } from '@/types';

const ACTIVE_ICON = require('../assets/images/status/active.png');
const ACTIVE_GREY_ICON = require('../assets/images/status/active-grey.png');
const BRUMATION_ICON = require('../assets/images/status/brumation.png');
const BRUMATION_GREY_ICON = require('../assets/images/status/brumation-grey.png');

interface DragonColumnProps {
  dragon: OverviewDragon;
  width: number;
  onToggleTask: (slotId: string) => void;
  onActivityChanged: () => void;
}

export default function DragonColumn({ dragon, width, onToggleTask, onActivityChanged }: DragonColumnProps) {
  const { pageTitleColor, language, t } = useAdminSettings();
  const showToast = useToast();
  const [updatingActivity, setUpdatingActivity] = useState(false);
  const ageLabel = getAgeLabel(dragon.age_category, language);
  const doneCount = dragon.tasks.filter((t) => t.completed || t.is_automatic).length;

  const handleSetActivity = async (state: 'active' | 'brumation') => {
    if (state === dragon.activity_state || updatingActivity) return;
    setUpdatingActivity(true);
    try {
      await api.put(`/dragons/${dragon.dragon_id}/activity-state`, { activity_state: state });
      showToast(
        t(state === 'brumation' ? 'overview.brumationToastOn' : 'overview.brumationToastOff', { name: dragon.name }),
        'success'
      );
      onActivityChanged();
    } catch (e: any) {
      showToast(e.message || t('overview.activityUpdateError'), 'error');
    } finally {
      setUpdatingActivity(false);
    }
  };

  return (
    <View style={[styles.column, { width }]} testID={`dragon-column-${dragon.dragon_id}`}>
      <View style={styles.header}>
        <DragonAvatar photoBase64={dragon.photo_base64} size={52} />
        <View style={styles.headerText}>
          <Text
            style={[styles.name, pageTitleColor ? { color: pageTitleColor } : null]}
            numberOfLines={1}
            testID={`dragon-column-name-${dragon.dragon_id}`}
          >
            {dragon.name}
          </Text>
          <View style={styles.ageBadge}>
            <Text style={styles.ageText}>{ageLabel}</Text>
          </View>
        </View>
        <View style={styles.activityToggle}>
          <TouchableOpacity
            onPress={() => handleSetActivity('active')}
            disabled={updatingActivity}
            testID={`dragon-activity-active-${dragon.dragon_id}`}
            accessibilityLabel={t('overview.activeState')}
          >
            <Image
              source={dragon.activity_state === 'active' ? ACTIVE_ICON : ACTIVE_GREY_ICON}
              style={styles.activityIcon}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleSetActivity('brumation')}
            disabled={updatingActivity}
            testID={`dragon-activity-brumation-${dragon.dragon_id}`}
            accessibilityLabel={t('overview.brumationState')}
          >
            <Image
              source={dragon.activity_state === 'brumation' ? BRUMATION_ICON : BRUMATION_GREY_ICON}
              style={styles.activityIcon}
            />
          </TouchableOpacity>
        </View>
      </View>

      {dragon.tasks.length > 0 && (
        <Text
          style={[styles.progress, pageTitleColor ? { color: pageTitleColor } : null]}
          testID={`dragon-column-progress-${dragon.dragon_id}`}
        >
          {doneCount} {t('common.of')} {dragon.tasks.length} {t('common.done')}
        </Text>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        {dragon.tasks.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>{t('dragonColumn.emptyTasks', { age: ageLabel })}</Text>
          </View>
        ) : (
          dragon.tasks.map((task) => (
            <TaskRow
              key={task.slot_id}
              task={task}
              onToggle={() => onToggleTask(task.slot_id)}
              testID={`task-row-${dragon.dragon_id}-${task.slot_id}`}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    paddingHorizontal: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  activityToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activityIcon: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  ageBadge: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  ageText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  progress: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  list: {
    paddingBottom: 24,
  },
  emptyBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
});
