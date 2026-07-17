import { KEYS, getAll, setAll, getObject, setObject } from './storage';
import { generateId, nowIso } from './idGen';
import type {
  Dragon,
  WeightEntry,
  TaskItem,
  TimeSlotRecord,
  ScheduleSlot,
  Completion,
  AppSettingsRecord,
  AgeCategory,
} from './types';

export function computeAgeCategory(birthday: string): AgeCategory {
  let born: Date;
  try {
    const [y, m, d] = birthday.split('-').map((v) => parseInt(v, 10));
    born = new Date(y, m - 1, d);
    if (Number.isNaN(born.getTime())) throw new Error('invalid');
  } catch {
    return '2-4';
  }
  const today = new Date();
  let months = (today.getFullYear() - born.getFullYear()) * 12 + (today.getMonth() - born.getMonth());
  if (today.getDate() < born.getDate()) months -= 1;
  months = Math.max(months, 0);
  if (months < 4) return '2-4';
  if (months < 7) return '4-7';
  if (months < 12) return '7-12';
  return '12+';
}

/* ---------------------------- Dragons ---------------------------- */

export async function listDragons(): Promise<Dragon[]> {
  const docs = await getAll<Dragon>(KEYS.DRAGONS);
  let changed = false;
  for (const d of docs) {
    const fresh = computeAgeCategory(d.birthday);
    if (d.age_category !== fresh) {
      d.age_category = fresh;
      changed = true;
    }
  }
  if (changed) await setAll(KEYS.DRAGONS, docs);
  return [...docs].sort((a, b) => (a.created_at < b.created_at ? -1 : 1));
}

export async function getDragon(id: string): Promise<Dragon | null> {
  const docs = await listDragons();
  return docs.find((d) => d.id === id) || null;
}

export async function createDragon(payload: {
  name: string;
  gender: Dragon['gender'];
  color: string;
  morph: string;
  birthday: string;
  photo_base64?: string | null;
}): Promise<Dragon> {
  const docs = await getAll<Dragon>(KEYS.DRAGONS);
  const dragon: Dragon = {
    id: generateId(),
    name: payload.name,
    gender: payload.gender,
    color: payload.color,
    morph: payload.morph,
    birthday: payload.birthday,
    age_category: computeAgeCategory(payload.birthday),
    photo_base64: payload.photo_base64 ?? null,
    activity_state: 'active',
    created_at: nowIso(),
  };
  docs.push(dragon);
  await setAll(KEYS.DRAGONS, docs);
  return dragon;
}

export async function updateDragon(id: string, payload: Partial<Dragon>): Promise<Dragon | null> {
  const docs = await getAll<Dragon>(KEYS.DRAGONS);
  const idx = docs.findIndex((d) => d.id === id);
  if (idx === -1) return null;
  const updateData: Partial<Dragon> = {};
  Object.entries(payload).forEach(([k, v]) => {
    if (v !== null && v !== undefined) (updateData as any)[k] = v;
  });
  docs[idx] = { ...docs[idx], ...updateData };
  if (updateData.birthday) {
    docs[idx].age_category = computeAgeCategory(updateData.birthday);
  }
  await setAll(KEYS.DRAGONS, docs);
  return docs[idx];
}

export async function updateDragonActivityState(id: string, activityState: Dragon['activity_state']): Promise<Dragon | null> {
  return updateDragon(id, { activity_state: activityState } as Partial<Dragon>);
}

export async function deleteDragon(id: string): Promise<boolean> {
  const docs = await getAll<Dragon>(KEYS.DRAGONS);
  const next = docs.filter((d) => d.id !== id);
  if (next.length === docs.length) return false;
  await setAll(KEYS.DRAGONS, next);

  const completions = await getAll<Completion>(KEYS.COMPLETIONS);
  await setAll(KEYS.COMPLETIONS, completions.filter((c) => c.dragon_id !== id));

  const weights = await getAll<WeightEntry>(KEYS.WEIGHT_ENTRIES);
  await setAll(KEYS.WEIGHT_ENTRIES, weights.filter((w) => w.dragon_id !== id));

  return true;
}

/* ------------------------- Weight entries ------------------------- */

export async function listWeightEntries(dragonId: string): Promise<WeightEntry[]> {
  const docs = await getAll<WeightEntry>(KEYS.WEIGHT_ENTRIES);
  return docs.filter((w) => w.dragon_id === dragonId).sort((a, b) => (a.date < b.date ? -1 : 1));
}

export async function createWeightEntry(
  dragonId: string,
  payload: { weight_grams: number; note?: string | null; date: string }
): Promise<WeightEntry> {
  const docs = await getAll<WeightEntry>(KEYS.WEIGHT_ENTRIES);
  const entry: WeightEntry = {
    id: generateId(),
    dragon_id: dragonId,
    weight_grams: payload.weight_grams,
    note: payload.note ?? null,
    date: payload.date,
    created_at: nowIso(),
  };
  docs.push(entry);
  await setAll(KEYS.WEIGHT_ENTRIES, docs);
  return entry;
}

export async function deleteWeightEntry(entryId: string): Promise<boolean> {
  const docs = await getAll<WeightEntry>(KEYS.WEIGHT_ENTRIES);
  const next = docs.filter((w) => w.id !== entryId);
  if (next.length === docs.length) return false;
  await setAll(KEYS.WEIGHT_ENTRIES, next);
  return true;
}

/* ----------------------------- Times ------------------------------ */

export async function listTimes(): Promise<TimeSlotRecord[]> {
  const docs = await getAll<TimeSlotRecord>(KEYS.TIMES);
  return [...docs].sort((a, b) => (a.time < b.time ? -1 : 1));
}

export async function createTime(payload: { time: string; winter_time?: string | null }): Promise<TimeSlotRecord> {
  const docs = await getAll<TimeSlotRecord>(KEYS.TIMES);
  if (docs.some((t) => t.time === payload.time)) {
    throw new Error('Dette tidspunkt findes allerede');
  }
  const record: TimeSlotRecord = {
    id: generateId(),
    time: payload.time,
    winter_time: payload.winter_time ?? null,
    created_at: nowIso(),
  };
  docs.push(record);
  await setAll(KEYS.TIMES, docs);
  return record;
}

export async function updateTime(id: string, payload: { time: string; winter_time?: string | null }): Promise<TimeSlotRecord> {
  const docs = await getAll<TimeSlotRecord>(KEYS.TIMES);
  const idx = docs.findIndex((t) => t.id === id);
  if (idx === -1) throw new Error('Tidspunkt ikke fundet');
  if (docs.some((t) => t.id !== id && t.time === payload.time)) {
    throw new Error('Dette tidspunkt findes allerede');
  }
  docs[idx] = { ...docs[idx], time: payload.time, winter_time: payload.winter_time ?? null };
  await setAll(KEYS.TIMES, docs);
  return docs[idx];
}

export async function deleteTime(id: string): Promise<void> {
  const slots = await getAll<ScheduleSlot>(KEYS.SCHEDULE_SLOTS);
  if (slots.some((s) => s.time_id === id)) {
    throw new Error('Tidspunktet bruges i en ugeplan og kan ikke slettes');
  }
  const docs = await getAll<TimeSlotRecord>(KEYS.TIMES);
  const next = docs.filter((t) => t.id !== id);
  if (next.length === docs.length) throw new Error('Tidspunkt ikke fundet');
  await setAll(KEYS.TIMES, next);
}

/* --------------------------- Task items ---------------------------- */

export async function listTaskItems(category?: string | null): Promise<TaskItem[]> {
  const docs = await getAll<TaskItem>(KEYS.TASK_ITEMS);
  const filtered = category ? docs.filter((i) => i.category === category) : docs;
  return [...filtered].sort((a, b) => (a.created_at < b.created_at ? -1 : 1));
}

export async function createTaskItem(payload: {
  category: TaskItem['category'];
  name: string;
  is_automatic: boolean;
  name_da: string;
  name_en: string;
}): Promise<TaskItem> {
  const docs = await getAll<TaskItem>(KEYS.TASK_ITEMS);
  const item: TaskItem = {
    id: generateId(),
    category: payload.category,
    name: payload.name,
    name_da: payload.name_da,
    name_en: payload.name_en,
    is_automatic: payload.is_automatic,
    created_at: nowIso(),
  };
  docs.push(item);
  await setAll(KEYS.TASK_ITEMS, docs);
  return item;
}

export async function updateTaskItem(
  id: string,
  payload: { name: string; is_automatic: boolean; name_da?: string; name_en?: string }
): Promise<TaskItem> {
  const docs = await getAll<TaskItem>(KEYS.TASK_ITEMS);
  const idx = docs.findIndex((i) => i.id === id);
  if (idx === -1) throw new Error('Emne ikke fundet');
  docs[idx] = {
    ...docs[idx],
    name: payload.name,
    is_automatic: payload.is_automatic,
    ...(payload.name_da !== undefined ? { name_da: payload.name_da } : {}),
    ...(payload.name_en !== undefined ? { name_en: payload.name_en } : {}),
  };
  await setAll(KEYS.TASK_ITEMS, docs);
  return docs[idx];
}

export async function deleteTaskItem(id: string): Promise<void> {
  const docs = await getAll<TaskItem>(KEYS.TASK_ITEMS);
  const next = docs.filter((i) => i.id !== id);
  if (next.length === docs.length) throw new Error('Emne ikke fundet');
  await setAll(KEYS.TASK_ITEMS, next);

  const slots = await getAll<ScheduleSlot>(KEYS.SCHEDULE_SLOTS);
  let slotsChanged = false;
  for (const s of slots) {
    if (s.item_ids.includes(id)) {
      s.item_ids = s.item_ids.filter((i) => i !== id);
      slotsChanged = true;
    }
  }
  if (slotsChanged) await setAll(KEYS.SCHEDULE_SLOTS, slots);
}

/* ------------------------- Schedule slots -------------------------- */

export async function listScheduleSlots(filter?: { age_category?: string; day_of_week?: string }): Promise<ScheduleSlot[]> {
  const docs = await getAll<ScheduleSlot>(KEYS.SCHEDULE_SLOTS);
  return docs.filter((s) => {
    if (filter?.age_category && s.age_category !== filter.age_category) return false;
    if (filter?.day_of_week && s.day_of_week !== filter.day_of_week) return false;
    return true;
  });
}

export async function createScheduleSlot(payload: Omit<ScheduleSlot, 'id' | 'created_at'>): Promise<ScheduleSlot> {
  const docs = await getAll<ScheduleSlot>(KEYS.SCHEDULE_SLOTS);
  const slot: ScheduleSlot = { ...payload, id: generateId(), created_at: nowIso() };
  docs.push(slot);
  await setAll(KEYS.SCHEDULE_SLOTS, docs);
  return slot;
}

export async function bulkCopyScheduleSlots(payload: {
  day_of_weeks: ScheduleSlot['day_of_week'][];
  age_categories: ScheduleSlot['age_category'][];
  time_id: string;
  category: ScheduleSlot['category'];
  item_ids: string[];
  is_automatic: boolean;
}): Promise<ScheduleSlot[]> {
  const docs = await getAll<ScheduleSlot>(KEYS.SCHEDULE_SLOTS);
  const results: ScheduleSlot[] = [];
  for (const day of payload.day_of_weeks) {
    for (const age of payload.age_categories) {
      const existingIdx = docs.findIndex(
        (s) => s.age_category === age && s.day_of_week === day && s.time_id === payload.time_id && s.category === payload.category
      );
      if (existingIdx !== -1) {
        docs[existingIdx] = { ...docs[existingIdx], item_ids: payload.item_ids, is_automatic: payload.is_automatic };
        results.push(docs[existingIdx]);
      } else {
        const slot: ScheduleSlot = {
          id: generateId(),
          age_category: age,
          day_of_week: day,
          time_id: payload.time_id,
          category: payload.category,
          item_ids: payload.item_ids,
          is_automatic: payload.is_automatic,
          created_at: nowIso(),
        };
        docs.push(slot);
        results.push(slot);
      }
    }
  }
  await setAll(KEYS.SCHEDULE_SLOTS, docs);
  return results;
}

export async function updateScheduleSlot(id: string, payload: Partial<ScheduleSlot>): Promise<ScheduleSlot> {
  const docs = await getAll<ScheduleSlot>(KEYS.SCHEDULE_SLOTS);
  const idx = docs.findIndex((s) => s.id === id);
  if (idx === -1) throw new Error('Task ikke fundet');
  const updateData: Partial<ScheduleSlot> = {};
  Object.entries(payload).forEach(([k, v]) => {
    if (v !== null && v !== undefined) (updateData as any)[k] = v;
  });
  docs[idx] = { ...docs[idx], ...updateData };
  await setAll(KEYS.SCHEDULE_SLOTS, docs);
  return docs[idx];
}

export async function deleteScheduleSlot(id: string, allDays: boolean): Promise<{ deleted_count: number }> {
  const docs = await getAll<ScheduleSlot>(KEYS.SCHEDULE_SLOTS);
  const slot = docs.find((s) => s.id === id);
  if (!slot) throw new Error('Task ikke fundet');

  if (allDays) {
    const matching = docs.filter(
      (s) => s.age_category === slot.age_category && s.time_id === slot.time_id && s.category === slot.category
    );
    const ids = new Set(matching.map((m) => m.id));
    const next = docs.filter((s) => !ids.has(s.id));
    await setAll(KEYS.SCHEDULE_SLOTS, next);
    const completions = await getAll<Completion>(KEYS.COMPLETIONS);
    await setAll(KEYS.COMPLETIONS, completions.filter((c) => !ids.has(c.schedule_slot_id)));
    return { deleted_count: ids.size };
  }

  const next = docs.filter((s) => s.id !== id);
  await setAll(KEYS.SCHEDULE_SLOTS, next);
  const completions = await getAll<Completion>(KEYS.COMPLETIONS);
  await setAll(KEYS.COMPLETIONS, completions.filter((c) => c.schedule_slot_id !== id));
  return { deleted_count: 1 };
}

/* ---------------------------- Completions --------------------------- */

export async function toggleCompletion(payload: { dragon_id: string; schedule_slot_id: string; date: string }): Promise<{ completed: boolean }> {
  const docs = await getAll<Completion>(KEYS.COMPLETIONS);
  const idx = docs.findIndex(
    (c) => c.dragon_id === payload.dragon_id && c.schedule_slot_id === payload.schedule_slot_id && c.date === payload.date
  );
  if (idx !== -1) {
    const newState = !docs[idx].completed;
    docs[idx] = { ...docs[idx], completed: newState, completed_at: nowIso() };
    await setAll(KEYS.COMPLETIONS, docs);
    return { completed: newState };
  }
  const comp: Completion = {
    id: generateId(),
    dragon_id: payload.dragon_id,
    schedule_slot_id: payload.schedule_slot_id,
    date: payload.date,
    completed: true,
    completed_at: nowIso(),
  };
  docs.push(comp);
  await setAll(KEYS.COMPLETIONS, docs);
  return { completed: true };
}

/* ----------------------------- Settings ------------------------------ */

const DEFAULT_SETTINGS: AppSettingsRecord = {
  banner_image_base64: null,
  banner_text: null,
  banner_bg_color: null,
  heading_color: null,
  app_bg_color: null,
  page_title_color: null,
  language: null,
  weight_unit: 'g',
  time_format: '12h',
  light_summer_start: '03-01',
  light_winter_start: '09-01',
};

export async function getSettings(): Promise<AppSettingsRecord> {
  const doc = await getObject<AppSettingsRecord>(KEYS.SETTINGS);
  return doc ? { ...DEFAULT_SETTINGS, ...doc } : { ...DEFAULT_SETTINGS };
}

export async function updateSettings(payload: Partial<AppSettingsRecord>): Promise<AppSettingsRecord> {
  const current = await getSettings();
  const updateData: Partial<AppSettingsRecord> = {};
  Object.entries(payload).forEach(([k, v]) => {
    if (v !== undefined) (updateData as any)[k] = v;
  });
  const next: AppSettingsRecord = { ...current, ...updateData, updated_at: nowIso() };
  await setObject(KEYS.SETTINGS, next);
  return next;
}
