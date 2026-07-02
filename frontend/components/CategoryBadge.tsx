import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/colors';
import { CATEGORY_ICONS } from '@/constants/data';
import { getCategoryLabel } from '@/i18n/translations';
import { useAdminSettings } from '@/context/AdminSettingsContext';
import type { TaskCategory } from '@/types';

interface CategoryBadgeProps {
  category: TaskCategory;
  small?: boolean;
}

export default function CategoryBadge({ category, small }: CategoryBadgeProps) {
  const { language } = useAdminSettings();
  const palette = COLORS.categories[category];
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: palette.light, borderColor: palette.border },
        small && styles.badgeSmall,
      ]}
      testID={`category-badge-${category}`}
    >
      <Ionicons name={CATEGORY_ICONS[category] as any} size={small ? 11 : 13} color={palette.text} />
      <Text style={[styles.text, { color: palette.text }, small && styles.textSmall]}>
        {getCategoryLabel(category, language)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: 'flex-start',
  },
  badgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  text: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  textSmall: {
    fontSize: 10,
  },
});
