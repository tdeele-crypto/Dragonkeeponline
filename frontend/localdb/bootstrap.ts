/**
 * First-run bootstrap for the local, on-device database.
 *
 * One-time migration: this app used to store data in a MongoDB/FastAPI
 * backend. To move to a fully local/offline architecture (no server, no
 * hosting cost) without losing anything, the user's real data - captured
 * from the live backend right before this migration - is bundled as
 * migrationSeedData.json and loaded into AsyncStorage exactly once, the
 * first time this new version runs. Every run after that uses whatever is
 * already in AsyncStorage (edited freely by the user from then on).
 *
 * If migrationSeedData.json is ever empty (e.g. a genuinely fresh install
 * with no prior backend data), the built-in default bilingual care plan is
 * loaded instead so the app isn't empty on first launch.
 */
import { KEYS, getObject, setObject, setAll } from './storage';
import { buildDefaultCareplan } from './defaultCareplan';
import migrationSeedData from './migrationSeedData.json';
import type { Dragon, WeightEntry, TaskItem, TimeSlotRecord, ScheduleSlot, Completion, AppSettingsRecord } from './types';

const META_MIGRATION_KEY = 'bootstrap_done_v1';

function normalizeIds<T extends { id?: string }>(docs: any[]): T[] {
  return (docs || []).map((doc) => {
    if (doc.id) return doc as T;
    const { _id, ...rest } = doc;
    return { ...rest, id: _id } as T;
  });
}

async function seedFromMigrationData(): Promise<void> {
  const data: any = migrationSeedData;
  await setAll(KEYS.DRAGONS, normalizeIds<Dragon>(data.dragons));
  await setAll(KEYS.TASK_ITEMS, normalizeIds<TaskItem>(data.task_items));
  await setAll(KEYS.TIMES, normalizeIds<TimeSlotRecord>(data.times));
  await setAll(KEYS.SCHEDULE_SLOTS, normalizeIds<ScheduleSlot>(data.schedule_slots));
  await setAll(KEYS.COMPLETIONS, normalizeIds<Completion>(data.completions));
  await setAll(KEYS.WEIGHT_ENTRIES, normalizeIds<WeightEntry>(data.weight_entries || []));

  if (data.app_settings && data.app_settings.length > 0) {
    const raw = data.app_settings[0] || {};
    const settings: AppSettingsRecord = {
      banner_image_base64: raw.banner_image_base64 ?? null,
      banner_text: raw.banner_text ?? null,
      banner_bg_color: raw.banner_bg_color ?? null,
      heading_color: raw.heading_color ?? null,
      app_bg_color: raw.app_bg_color ?? null,
      page_title_color: raw.page_title_color ?? null,
      language: raw.language ?? null,
      weight_unit: raw.weight_unit || 'g',
      time_format: raw.time_format || '12h',
      light_summer_start: raw.light_summer_start || '03-01',
      light_winter_start: raw.light_winter_start || '09-01',
      updated_at: raw.updated_at,
    };
    await setObject(KEYS.SETTINGS, settings);
  }
}

async function seedDefaultCareplanOnly(): Promise<void> {
  const { times, taskItems, scheduleSlots } = buildDefaultCareplan();
  await setAll(KEYS.TIMES, times);
  await setAll(KEYS.TASK_ITEMS, taskItems);
  await setAll(KEYS.SCHEDULE_SLOTS, scheduleSlots);
  await setAll(KEYS.DRAGONS, []);
  await setAll(KEYS.COMPLETIONS, []);
  await setAll(KEYS.WEIGHT_ENTRIES, []);
}

export async function bootstrapLocalDb(): Promise<void> {
  const done = await getObject<boolean>(KEYS.META + ':' + META_MIGRATION_KEY);
  if (done) return;

  const data: any = migrationSeedData;
  const hasMigrationData = Array.isArray(data?.dragons) || Array.isArray(data?.times) || Array.isArray(data?.task_items);
  try {
    if (hasMigrationData) {
      await seedFromMigrationData();
    } else {
      await seedDefaultCareplanOnly();
    }
  } catch (e) {
    console.log('Local DB bootstrap failed, falling back to default care plan:', e);
    await seedDefaultCareplanOnly();
  }

  await setObject(KEYS.META + ':' + META_MIGRATION_KEY, true);
}
