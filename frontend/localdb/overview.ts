/**
 * Daily overview aggregation + monthly calendar-summary - ported from the
 * previous backend's routes/overview.py, now running entirely on-device
 * against the local AsyncStorage-backed repositories.
 */
import { formatDateISO, getDanishDayOfWeek } from '@/constants/data';
import { getAll, KEYS } from './storage';
import { listDragons, listTimes, listTaskItems, getSettings, computeAgeCategory } from './repos';
import { isInWinterPeriod, applyWinterTimes, type WinterAdjustableTask } from './season';
import type { Completion, ScheduleSlot } from './types';

function completionKey(dragonId: string, slotId: string): string {
  return `${dragonId}\u0000${slotId}`;
}

export async function getDailyOverview(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map((v) => parseInt(v, 10));
  const dateObj = new Date(y, m - 1, d);
  if (Number.isNaN(dateObj.getTime())) {
    throw new Error('Ugyldigt datoformat, brug YYYY-MM-DD');
  }
  const dayOfWeek = getDanishDayOfWeek(dateObj);

  const dragons = await listDragons();
  const times = await listTimes();
  const timesMap: Record<string, string> = {};
  const timesWinterMap: Record<string, string | null | undefined> = {};
  for (const t of times) {
    timesMap[t.id] = t.time;
    timesWinterMap[t.id] = t.winter_time;
  }

  const settings = await getSettings();
  const language = settings.language || 'en';
  const nameField = language === 'da' ? 'name_da' : 'name_en';

  const taskItems = await listTaskItems();
  const itemsMap: Record<string, string> = {};
  for (const item of taskItems) {
    const name = (item as any)[nameField] || item.name;
    if (name) itemsMap[item.id] = name;
  }

  const allSlots = await getAll<ScheduleSlot>(KEYS.SCHEDULE_SLOTS);
  const allCompletions = await getAll<Completion>(KEYS.COMPLETIONS);
  const dayCompletions = allCompletions.filter((c) => c.date === dateStr);
  const completionMap: Record<string, boolean> = {};
  for (const c of dayCompletions) {
    completionMap[completionKey(c.dragon_id, c.schedule_slot_id)] = c.completed;
  }

  const inWinter = isInWinterPeriod(dateObj, settings.light_summer_start, settings.light_winter_start);

  const result = [] as any[];
  for (const dragon of dragons) {
    const dragonId = dragon.id;
    const ageCategory = computeAgeCategory(dragon.birthday);
    const activityState = dragon.activity_state || 'active';

    let slots = allSlots.filter((s) => s.age_category === ageCategory && s.day_of_week === dayOfWeek);
    if (activityState === 'brumation') {
      // Bearded dragons in brumation stop eating - hide all feeding tasks
      // until switched back to "active". Care/Light&Heat tasks still apply.
      slots = slots.filter((s) => s.category !== 'fodring');
    }

    const tasks: (WinterAdjustableTask & { slot_id: string; item_names: string[]; completed: boolean })[] = slots.map((slot) => {
      const timeStr = timesMap[slot.time_id] || '??:??';
      const itemNames = slot.item_ids.map((iid) => itemsMap[iid]).filter(Boolean);
      return {
        slot_id: slot.id,
        time: timeStr,
        time_id: slot.time_id,
        category: slot.category,
        item_names: itemNames,
        is_automatic: slot.is_automatic,
        completed: completionMap[completionKey(dragonId, slot.id)] || false,
      };
    });
    tasks.sort((a, b) => (a.time < b.time ? -1 : a.time > b.time ? 1 : 0));

    if (inWinter) {
      applyWinterTimes(tasks, timesWinterMap);
    }
    const cleanTasks = tasks.map(({ time_id, ...rest }) => rest);

    result.push({
      dragon_id: dragonId,
      name: dragon.name,
      photo_base64: dragon.photo_base64,
      age_category: ageCategory,
      activity_state: activityState,
      tasks: cleanTasks,
    });
  }

  return { date: dateStr, day_of_week: dayOfWeek, is_winter_period: inWinter, dragons: result };
}

export async function getCalendarSummary(year: number, month: number, dragonId?: string | null) {
  const daysInMonth = new Date(year, month, 0).getDate();

  let dragons = await listDragons();
  if (dragonId) dragons = dragons.filter((d) => d.id === dragonId);
  const dragonInfo = dragons.map((d) => ({
    id: d.id,
    age_category: computeAgeCategory(d.birthday),
    activity_state: d.activity_state || 'active',
  }));

  const allSlots = await getAll<ScheduleSlot>(KEYS.SCHEDULE_SLOTS);
  const allCompletions = await getAll<Completion>(KEYS.COMPLETIONS);

  const slotsCache: Record<string, ScheduleSlot[]> = {};
  function getSlots(dayOfWeek: string, ageCategory: string, activityState: string): ScheduleSlot[] {
    const key = `${dayOfWeek}\u0000${ageCategory}\u0000${activityState}`;
    if (!slotsCache[key]) {
      let slots = allSlots.filter((s) => s.age_category === ageCategory && s.day_of_week === dayOfWeek);
      if (activityState === 'brumation') slots = slots.filter((s) => s.category !== 'fodring');
      slotsCache[key] = slots;
    }
    return slotsCache[key];
  }

  const daysResult: any[] = [];
  for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
    const dObj = new Date(year, month - 1, dayNum);
    const dateStr = formatDateISO(dObj);
    const dayOfWeek = getDanishDayOfWeek(dObj);

    const dragonSlots: Record<string, ScheduleSlot[]> = {};
    let total = 0;
    for (const info of dragonInfo) {
      const slots = getSlots(dayOfWeek, info.age_category, info.activity_state);
      // Only count manually-registrable tasks - automatic (equipment) tasks
      // like UVB/heat lamps run on their own and shouldn't affect status.
      const registrable = slots.filter((s) => !s.is_automatic);
      dragonSlots[info.id] = registrable;
      total += registrable.length;
    }

    if (total === 0) {
      daysResult.push({ date: dateStr, status: 'none', total: 0, completed: 0 });
      continue;
    }

    const dayCompletions = allCompletions.filter((c) => c.date === dateStr);
    const completionMap: Record<string, boolean> = {};
    for (const c of dayCompletions) completionMap[completionKey(c.dragon_id, c.schedule_slot_id)] = c.completed;

    let completed = 0;
    for (const info of dragonInfo) {
      for (const slot of dragonSlots[info.id]) {
        if (completionMap[completionKey(info.id, slot.id)]) completed += 1;
      }
    }

    let status: 'green' | 'yellow' | 'red';
    if (completed === 0) status = 'red';
    else if (completed >= total) status = 'green';
    else status = 'yellow';

    daysResult.push({ date: dateStr, status, total, completed });
  }

  return { year, month, days: daysResult };
}
