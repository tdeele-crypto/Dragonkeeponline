export type AgeCategory = '2-4' | '4-7' | '7-12' | '12+';
export type TaskCategory = 'fodring' | 'pleje' | 'lys';
export type DayOfWeek = 'mandag' | 'tirsdag' | 'onsdag' | 'torsdag' | 'fredag' | 'lørdag' | 'søndag';
export type Gender = 'Han' | 'Hun' | 'Ukendt';
export type AppLanguage = 'en' | 'da';
export type WeightUnitPref = 'g' | 'oz';
export type TimeFormatPref = '12h' | '24h';
export type ActivityState = 'active' | 'brumation';

export interface Dragon {
  id: string;
  name: string;
  gender: Gender;
  color: string;
  morph: string;
  birthday: string;
  age_category: AgeCategory;
  photo_base64?: string | null;
  activity_state: ActivityState;
  created_at: string;
}

export interface WeightEntry {
  id: string;
  dragon_id: string;
  weight_grams: number;
  note?: string | null;
  date: string;
  created_at: string;
}

export interface TaskItem {
  id: string;
  category: TaskCategory;
  name: string;
  name_da?: string | null;
  name_en?: string | null;
  is_automatic: boolean;
  created_at: string;
}

export interface TimeSlotRecord {
  id: string;
  time: string;
  winter_time?: string | null;
  created_at: string;
}

export interface ScheduleSlot {
  id: string;
  age_category: AgeCategory;
  day_of_week: DayOfWeek;
  time_id: string;
  category: TaskCategory;
  item_ids: string[];
  is_automatic: boolean;
  created_at: string;
}

export interface Completion {
  id: string;
  dragon_id: string;
  schedule_slot_id: string;
  date: string;
  completed: boolean;
  completed_at: string;
}

export interface AppSettingsRecord {
  banner_image_base64?: string | null;
  banner_text?: string | null;
  banner_bg_color?: string | null;
  heading_color?: string | null;
  app_bg_color?: string | null;
  page_title_color?: string | null;
  language?: AppLanguage | null;
  weight_unit: WeightUnitPref;
  time_format: TimeFormatPref;
  light_summer_start: string;
  light_winter_start: string;
  updated_at?: string;
}
