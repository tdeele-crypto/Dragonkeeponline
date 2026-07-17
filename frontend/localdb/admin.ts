/**
 * Admin data-management operations (export / import / reset-careplan) -
 * ported from the previous backend's routes/admin.py, now operating
 * entirely on the local AsyncStorage-backed collections.
 */
import { KEYS, getAll, setAll, setObject, clearAllCollections } from './storage';
import { buildDefaultCareplan } from './defaultCareplan';
import { getSettings } from './repos';
import type { Dragon, WeightEntry, TaskItem, TimeSlotRecord, ScheduleSlot, Completion, AppSettingsRecord } from './types';

export async function exportDatabase() {
  const [dragons, taskItems, times, scheduleSlots, completions, weightEntries, settings] = await Promise.all([
    getAll<Dragon>(KEYS.DRAGONS),
    getAll<TaskItem>(KEYS.TASK_ITEMS),
    getAll<TimeSlotRecord>(KEYS.TIMES),
    getAll<ScheduleSlot>(KEYS.SCHEDULE_SLOTS),
    getAll<Completion>(KEYS.COMPLETIONS),
    getAll<WeightEntry>(KEYS.WEIGHT_ENTRIES),
    getSettings(),
  ]);

  return {
    version: 2,
    exported_at: new Date().toISOString(),
    dragons,
    task_items: taskItems,
    times,
    schedule_slots: scheduleSlots,
    completions,
    weight_entries: weightEntries,
    app_settings: [settings],
  };
}

/** Older backup files (exported before the app moved to fully local/offline
 * storage) used MongoDB-style "_id" fields instead of "id" - normalize them
 * so old backups can still be restored. */
function normalizeIds<T extends { id?: string }>(docs: any[]): T[] {
  return (docs || []).map((doc) => {
    if (doc.id) return doc as T;
    const { _id, ...rest } = doc;
    return { ...rest, id: _id } as T;
  });
}

export async function importDatabase(payload: any): Promise<void> {
  const requiredKeys = ['dragons', 'task_items', 'times', 'schedule_slots', 'completions'];
  for (const key of requiredKeys) {
    if (!(key in payload)) {
      throw new Error(`Ugyldig fil: mangler '${key}'`);
    }
  }

  await clearAllCollections();

  await setAll(KEYS.DRAGONS, normalizeIds<Dragon>(payload.dragons));
  await setAll(KEYS.TASK_ITEMS, normalizeIds<TaskItem>(payload.task_items));
  await setAll(KEYS.TIMES, normalizeIds<TimeSlotRecord>(payload.times));
  await setAll(KEYS.SCHEDULE_SLOTS, normalizeIds<ScheduleSlot>(payload.schedule_slots));
  await setAll(KEYS.COMPLETIONS, normalizeIds<Completion>(payload.completions));
  await setAll(KEYS.WEIGHT_ENTRIES, normalizeIds<WeightEntry>(payload.weight_entries || []));

  if (payload.app_settings && payload.app_settings.length > 0) {
    // Full replace (not merge) to exactly mirror the imported backup, same
    // as the old backend's import behaviour (delete_many + insert_many).
    await setObject<AppSettingsRecord>(KEYS.SETTINGS, payload.app_settings[0]);
  }
}

export async function resetCareplan(): Promise<{ times_count: number; items_count: number; schedule_slots_count: number }> {
  await setAll(KEYS.TIMES, []);
  await setAll(KEYS.TASK_ITEMS, []);
  await setAll(KEYS.SCHEDULE_SLOTS, []);
  await setAll(KEYS.COMPLETIONS, []);

  const { times, taskItems, scheduleSlots } = buildDefaultCareplan();
  await setAll(KEYS.TIMES, times);
  await setAll(KEYS.TASK_ITEMS, taskItems);
  await setAll(KEYS.SCHEDULE_SLOTS, scheduleSlots);

  return {
    times_count: times.length,
    items_count: taskItems.length,
    schedule_slots_count: scheduleSlots.length,
  };
}
