import { Platform } from 'react-native';
import type { Dragon, ScheduleSlot, TimeSlot, TaskItem } from '@/types';
import { CATEGORY_LABELS } from '@/constants/data';

// expo-notifications throws a hard error on import/init in Expo Go on
// Android (SDK 53+ removed that support there). We lazy-load the module and
// guard every call so the rest of the app never crashes because of it —
// notifications simply become unavailable in that environment (a real
// development/production build is unaffected).
type NotificationsModule = typeof import('expo-notifications');

let cachedModule: NotificationsModule | null = null;
let unavailable = false;

async function getNotifications(): Promise<NotificationsModule | null> {
  if (unavailable) return null;
  if (cachedModule) return cachedModule;
  try {
    const mod: NotificationsModule = await import('expo-notifications');
    mod.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    cachedModule = mod;
    return mod;
  } catch (e) {
    unavailable = true;
    console.log('expo-notifications er ikke tilgængelig i dette miljø (Expo Go begrænsning):', e);
    return null;
  }
}

export async function isNotificationsAvailable(): Promise<boolean> {
  const mod = await getNotifications();
  return !!mod;
}

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
  const Notifications = await getNotifications();
  if (!Notifications || Platform.OS !== 'android') return;
  try {
    await Notifications.setNotificationChannelAsync('dragon-tasks', {
      name: 'Skægagame opgaver',
      importance: Notifications.AndroidImportance.HIGH,
    });
  } catch (e) {
    console.log('Kunne ikke oprette notifikationskanal:', e);
  }
}

export async function requestNotificationPermissions(): Promise<boolean> {
  const Notifications = await getNotifications();
  if (!Notifications) return false;
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.status === 'granted') return true;
    const requested = await Notifications.requestPermissionsAsync();
    return requested.status === 'granted';
  } catch (e) {
    console.log('Kunne ikke anmode om notifikationstilladelse:', e);
    return false;
  }
}

export async function rescheduleAllNotifications(
  dragons: Dragon[],
  slots: ScheduleSlot[],
  times: TimeSlot[],
  items: TaskItem[],
) {
  const Notifications = await getNotifications();
  if (!Notifications) return;
  try {
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
  } catch (e) {
    console.log('Kunne ikke planlægge notifikationer:', e);
  }
}

export async function cancelAllNotifications() {
  const Notifications = await getNotifications();
  if (!Notifications) return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (e) {
    console.log('Kunne ikke annullere notifikationer:', e);
  }
}
