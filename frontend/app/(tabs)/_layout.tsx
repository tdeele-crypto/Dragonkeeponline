import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '@/constants/colors';
import { useAdminSettings } from '@/context/AdminSettingsContext';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { t } = useAdminSettings();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          height: 62 + insets.bottom,
          paddingBottom: insets.bottom + 8,
          paddingTop: 8,
          backgroundColor: COLORS.white,
          borderTopColor: COLORS.border,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.overview'),
          tabBarTestID: 'tab-overview',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'today' : 'today-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="dragons"
        options={{
          title: t('tabs.dragons'),
          tabBarTestID: 'tab-dragons',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'paw' : 'paw-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: t('tabs.schedule'),
          tabBarTestID: 'tab-schedule',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="lists"
        options={{
          title: t('tabs.tasks'),
          tabBarTestID: 'tab-lists',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'list' : 'list-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: t('tabs.admin'),
          tabBarTestID: 'tab-admin',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'settings' : 'settings-outline'} size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
