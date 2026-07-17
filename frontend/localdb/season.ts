/**
 * Seasonal light-schedule adjustment - ported 1:1 from the previous
 * backend's services/season.py.
 *
 * Bearded dragons in the wild experience shorter daylight hours in winter.
 * Admin configures a "summer start" and "winter start" date (day+month,
 * repeats every year). During the winter period, each Time entry can have
 * its own optional "winter time" override - when set, tasks scheduled at
 * that time use the winter time instead on the Daily Overview. Times/Tasks/
 * Schedules themselves are never modified.
 *
 * For any time slot WITHOUT an explicit winter override, the fallback rule
 * is: the task starts 30 minutes after the day's "lys tændt" (light-on)
 * time - i.e. the earliest 'lys' (Light & Heat) task of the day (using its
 * winter-adjusted time, if that slot itself has an override). The light-on
 * slot itself is left unchanged unless it has its own explicit winter
 * override.
 */

const LYS_ON_FALLBACK_OFFSET_MINUTES = 30;

export function parseMonthDay(value: string): [number, number] {
  const [monthStr, dayStr] = value.split('-');
  return [parseInt(monthStr, 10), parseInt(dayStr, 10)];
}

/** Winter period = [winter_start, summer_start), handled circularly across
 * the year boundary (whichever way it wraps). */
export function isInWinterPeriod(checkDate: Date, summerStart: string, winterStart: string): boolean {
  let summer: [number, number];
  let winter: [number, number];
  try {
    summer = parseMonthDay(summerStart);
    winter = parseMonthDay(winterStart);
  } catch {
    return false;
  }
  const today: [number, number] = [checkDate.getMonth() + 1, checkDate.getDate()];
  const cmp = (a: [number, number], b: [number, number]) => (a[0] - b[0]) * 100 + (a[1] - b[1]);
  if (cmp(winter, summer) <= 0) {
    return cmp(winter, today) <= 0 && cmp(today, summer) < 0;
  }
  return cmp(today, winter) >= 0 || cmp(today, summer) < 0;
}

/** Shift a 'HH:MM' string by minutesDelta, clamped to the same day. */
export function shiftTimeStr(timeStr: string, minutesDelta: number): string {
  try {
    const [h, m] = timeStr.split(':').map((v) => parseInt(v, 10));
    let total = h * 60 + m + minutesDelta;
    total = Math.max(0, Math.min(23 * 60 + 59, total));
    const hh = Math.floor(total / 60);
    const mm = total % 60;
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  } catch {
    return timeStr;
  }
}

export interface WinterAdjustableTask {
  time_id: string;
  time: string;
  category: string;
  [key: string]: any;
}

/** Mutates `tasks` in place for the winter period:
 * - If a task's time slot has an explicit winter_time override, use it.
 * - Otherwise, the earliest 'lys' task of the day ("lys tændt" / light-on)
 *   is left unchanged (unless it itself has an override, handled above).
 * - Every other task without its own override starts
 *   LYS_ON_FALLBACK_OFFSET_MINUTES after the effective light-on time.
 * Re-sorts `tasks` by the resulting time. */
export function applyWinterTimes(tasks: WinterAdjustableTask[], timesWinterMap: Record<string, string | null | undefined>): void {
  const lysTasks = tasks.filter((t) => t.category === 'lys');
  let lysOnTimeId: string | null = null;
  let lysOnEffective: string | null = null;
  if (lysTasks.length > 0) {
    const lysOn = lysTasks.reduce((min, t) => (t.time < min.time ? t : min), lysTasks[0]);
    lysOnTimeId = lysOn.time_id;
    lysOnEffective = timesWinterMap[lysOn.time_id] || lysOn.time;
  }

  for (const t of tasks) {
    const override = timesWinterMap[t.time_id];
    if (override) {
      t.time = override;
    } else if (t.time_id === lysOnTimeId) {
      continue;
    } else if (lysOnEffective) {
      t.time = shiftTimeStr(lysOnEffective, LYS_ON_FALLBACK_OFFSET_MINUTES);
    }
  }

  tasks.sort((a, b) => (a.time < b.time ? -1 : a.time > b.time ? 1 : 0));
}
