import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import DragonAvatar from '@/components/DragonAvatar';
import TaskRow from '@/components/TaskRow';
import { COLORS } from '@/constants/colors';
import { AGE_CATEGORIES } from '@/constants/data';
import type { OverviewDragon } from '@/types';

interface DragonColumnProps {
  dragon: OverviewDragon;
  width: number;
  onToggleTask: (slotId: string) => void;
}

export default function DragonColumn({ dragon, width, onToggleTask }: DragonColumnProps) {
  const ageLabel = AGE_CATEGORIES.find((a) => a.value === dragon.age_category)?.label || dragon.age_category;
  const doneCount = dragon.tasks.filter((t) => t.completed || t.is_automatic).length;

  return (
    <View style={[styles.column, { width }]} testID={`dragon-column-${dragon.dragon_id}`}>
      <View style={styles.header}>
        <DragonAvatar photoBase64={dragon.photo_base64} size={52} />
        <View style={styles.headerText}>
          <Text style={styles.name} numberOfLines={1} testID={`dragon-column-name-${dragon.dragon_id}`}>
            {dragon.name}
          </Text>
          <View style={styles.ageBadge}>
            <Text style={styles.ageText}>{ageLabel}</Text>
          </View>
        </View>
      </View>

      {dragon.tasks.length > 0 && (
        <Text style={styles.progress} testID={`dragon-column-progress-${dragon.dragon_id}`}>
          {doneCount} af {dragon.tasks.length} udført
        </Text>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        {dragon.tasks.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Ingen opgaver i dag for {ageLabel}</Text>
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
    gap: 12,
    marginBottom: 10,
  },
  headerText: {
    flex: 1,
    gap: 4,
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
