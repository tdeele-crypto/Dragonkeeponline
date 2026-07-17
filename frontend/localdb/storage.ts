/**
 * Generic local, on-device "collections" storage built on AsyncStorage.
 *
 * Each entity (dragons, times, task_items, ...) is stored as a single JSON
 * array under its own key, kept in an in-memory cache after first load so
 * repeated reads within a session don't re-hit AsyncStorage/JSON.parse.
 * This fully replaces the previous MongoDB/FastAPI backend - the app now
 * works 100% offline with zero server/database hosting cost.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export const KEYS = {
  DRAGONS: '@bdcare/dragons',
  WEIGHT_ENTRIES: '@bdcare/weight_entries',
  TIMES: '@bdcare/times',
  TASK_ITEMS: '@bdcare/task_items',
  SCHEDULE_SLOTS: '@bdcare/schedule_slots',
  COMPLETIONS: '@bdcare/completions',
  SETTINGS: '@bdcare/settings',
  META: '@bdcare/meta',
} as const;

type ArrayCache = Record<string, any[]>;
type ObjectCache = Record<string, any>;

const arrayCache: ArrayCache = {};
const objectCache: ObjectCache = {};

export async function getAll<T = any>(key: string): Promise<T[]> {
  if (arrayCache[key]) return arrayCache[key] as T[];
  const raw = await AsyncStorage.getItem(key);
  const parsed: T[] = raw ? JSON.parse(raw) : [];
  arrayCache[key] = parsed;
  return parsed;
}

export async function setAll<T = any>(key: string, items: T[]): Promise<void> {
  arrayCache[key] = items;
  await AsyncStorage.setItem(key, JSON.stringify(items));
}

export async function getObject<T = any>(key: string): Promise<T | null> {
  if (key in objectCache) return objectCache[key] as T;
  const raw = await AsyncStorage.getItem(key);
  const parsed = raw ? JSON.parse(raw) : null;
  objectCache[key] = parsed;
  return parsed;
}

export async function setObject<T = any>(key: string, value: T): Promise<void> {
  objectCache[key] = value;
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

/** Wipes every app collection (used by "Import data", which fully replaces
 * the local database with the contents of a backup file). */
export async function clearAllCollections(): Promise<void> {
  const keys = [
    KEYS.DRAGONS,
    KEYS.WEIGHT_ENTRIES,
    KEYS.TIMES,
    KEYS.TASK_ITEMS,
    KEYS.SCHEDULE_SLOTS,
    KEYS.COMPLETIONS,
  ];
  for (const k of keys) {
    arrayCache[k] = [];
  }
  await AsyncStorage.multiRemove(keys);
}
