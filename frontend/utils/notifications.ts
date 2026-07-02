import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Dragon, ScheduleSlot, TimeSlot, TaskItem } from '@/types';
import { CATEGORY_LABELS } from '@/constants/data';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const WEEKDAY_MAP: Record<string, number> = {
  søndag: 1,
  mandag: 2,
  tirsdag: 3,
  onsdag: 4,
  torsdag: 5,
  fredag: 6,
  lørdag: 7,
};

export async function ensureNotificationChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('dragon-tasks', {
      name: 'Skægagame opgaver',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
}

export async function requestNotificationPermissions(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.status === 'granted') return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.status === 'granted';
}

export async function rescheduleAllNotifications(
  dragons: Dragon[],
  slots: ScheduleSlot[],
  times: TimeSlot[],
  items: TaskItem[],
) {
  await Notifications.cancelAllScheduledNotificationsAsync();

  const timesMap = new Map(times.map((t) => [t.id, t.time]));
  const itemsMap = new Map(items.map((i) => [i.id, i.name]));

  for (const dragon of dragons) {
    const dragonSlots = slots.filter(
      (s) => s.age_category === dragon.age_category && !(s.category === 'lys' && s.is_automatic),
    );
    for (const slot of dragonSlots) {
      const timeStr = timesMap.get(slot.time_id);
      if (!timeStr) continue;
      const [hour, minute] = timeStr.split(':').map(Number);
      const weekday = WEEKDAY_MAP[slot.day_of_week];
      if (!weekday) continue;
      const itemNames = slot.item_ids.map((id) => itemsMap.get(id)).filter(Boolean).join(', ');

      await Notifications.scheduleNotificationAsync({
        content: {
          title: `${CATEGORY_LABELS[slot.category]} - ${dragon.name}`,
          body: itemNames || 'Tid til en opgave',
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday,
          hour,
          minute,
        } as Notifications.WeeklyTriggerInput,
      });
    }
  }
}

export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
