import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/colors';
import { CATEGORY_ICONS } from '@/constants/data';
import type { OverviewTask } from '@/types';

interface TaskRowProps {
  task: OverviewTask;
  onToggle: () => void;
  testID: string;
}

export default function TaskRow({ task, onToggle, testID }: TaskRowProps) {
  const palette = COLORS.categories[task.category];
  const itemsLabel = task.item_names.length > 0 ? task.item_names.join(' + ') : null;

  return (
    <View
      style={[styles.card, { backgroundColor: palette.light, borderColor: palette.border }]}
      testID={testID}
    >
      <View style={[styles.stripe, { backgroundColor: palette.bg }]} />
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Ionicons name={CATEGORY_ICONS[task.category] as any} size={15} color={palette.text} />
          <Text style={[styles.time, { color: palette.text }]}>{task.time}</Text>
          {task.is_automatic && (
            <View style={styles.autoBadge} testID={`${testID}-auto-badge`}>
              <Ionicons name="sync" size={10} color={COLORS.textSecondary} />
              <Text style={styles.autoText}>Automatisk</Text>
            </View>
          )}
        </View>
        {itemsLabel && (
          <Text style={[styles.itemsText, { color: palette.text }]} numberOfLines={2}>
            {itemsLabel}
          </Text>
        )}
      </View>

      {!task.is_automatic && (
        <TouchableOpacity
          style={[styles.checkbox, task.completed && { backgroundColor: palette.bg, borderColor: palette.bg }]}
          onPress={onToggle}
          testID={`${testID}-checkbox`}
          activeOpacity={0.7}
        >
          {task.completed && <Ionicons name="checkmark" size={20} color={COLORS.white} />}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
    minHeight: 64,
    alignItems: 'center',
  },
  stripe: {
    width: 5,
    height: '100%',
  },
  content: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 3,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  time: {
    fontSize: 15,
    fontWeight: '800',
  },
  autoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.white,
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginLeft: 4,
  },
  autoText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  itemsText: {
    fontSize: 13,
    fontWeight: '600',
  },
  checkbox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
});
