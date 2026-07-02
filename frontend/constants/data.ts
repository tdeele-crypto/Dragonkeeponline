import type { AgeCategory, DayOfWeek, Gender, TaskCategory } from '@/types';

export const AGE_CATEGORIES: { value: AgeCategory; label: string }[] = [
  { value: '2-4', label: '2-4 måneder' },
  { value: '4-7', label: '4-7 måneder' },
  { value: '7-12', label: '7-12 måneder' },
  { value: '12+', label: '12+ måneder' },
];

export const DAYS_OF_WEEK: DayOfWeek[] = [
  'mandag',
  'tirsdag',
  'onsdag',
  'torsdag',
  'fredag',
  'lørdag',
  'søndag',
];

export const DAY_LABELS: Record<DayOfWeek, string> = {
  mandag: 'Mandag',
  tirsdag: 'Tirsdag',
  onsdag: 'Onsdag',
  torsdag: 'Torsdag',
  fredag: 'Fredag',
  lørdag: 'Lørdag',
  søndag: 'Søndag',
};

export const DAY_LABELS_SHORT: Record<DayOfWeek, string> = {
  mandag: 'Man',
  tirsdag: 'Tir',
  onsdag: 'Ons',
  torsdag: 'Tor',
  fredag: 'Fre',
  lørdag: 'Lør',
  søndag: 'Søn',
};

export const GENDERS: Gender[] = ['Han', 'Hun', 'Ukendt'];

export const TASK_CATEGORIES: { value: TaskCategory; label: string; icon: string }[] = [
  { value: 'fodring', label: 'Fodring', icon: 'leaf' },
  { value: 'pleje', label: 'Pleje', icon: 'water' },
  { value: 'lys', label: 'Lys & Varme', icon: 'sunny' },
];

export const CATEGORY_LABELS: Record<TaskCategory, string> = {
  fodring: 'Fodring',
  pleje: 'Pleje',
  lys: 'Lys & Varme',
};

export const CATEGORY_ICONS: Record<TaskCategory, string> = {
  fodring: 'leaf',
  pleje: 'water',
  lys: 'sunny',
};

// JS weekday index (0=Sunday) to our Danish DayOfWeek
export const JS_WEEKDAY_TO_DAY: DayOfWeek[] = [
  'søndag',
  'mandag',
  'tirsdag',
  'onsdag',
  'torsdag',
  'fredag',
  'lørdag',
];

export function formatDateISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getDanishDayOfWeek(d: Date): DayOfWeek {
  return JS_WEEKDAY_TO_DAY[d.getDay()];
}

const MONTH_NAMES = [
  'januar', 'februar', 'marts', 'april', 'maj', 'juni',
  'juli', 'august', 'september', 'oktober', 'november', 'december',
];

export function formatFullDateDanish(d: Date): string {
  const dayLabel = DAY_LABELS[getDanishDayOfWeek(d)];
  return `${dayLabel} ${d.getDate()}. ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDateDanish(d: Date): string {
  return `${d.getDate()}. ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDateShortDanish(d: Date): string {
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function computeAgeCategory(birthday: Date): AgeCategory {
  const today = new Date();
  let months = (today.getFullYear() - birthday.getFullYear()) * 12 + (today.getMonth() - birthday.getMonth());
  if (today.getDate() < birthday.getDate()) months -= 1;
  months = Math.max(months, 0);
  if (months < 4) return '2-4';
  if (months < 7) return '4-7';
  if (months < 12) return '7-12';
  return '12+';
}
