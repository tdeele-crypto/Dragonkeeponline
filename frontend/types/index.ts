export type AgeCategory = '2-4' | '4-7' | '7-12' | '12+';
export type TaskCategory = 'fodring' | 'pleje' | 'lys';
export type DayOfWeek =
  | 'mandag'
  | 'tirsdag'
  | 'onsdag'
  | 'torsdag'
  | 'fredag'
  | 'lørdag'
  | 'søndag';
export type Gender = 'Han' | 'Hun' | 'Ukendt';

export interface Dragon {
  id: string;
  name: string;
  gender: Gender;
  color: string;
  morph: string;
  birthday: string;
  age_category: AgeCategory;
  photo_base64?: string | null;
  created_at: string;
}

export interface TaskItem {
  id: string;
  category: TaskCategory;
  name: string;
  created_at: string;
}

export interface TimeSlot {
  id: string;
  time: string;
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

export interface OverviewTask {
  slot_id: string;
  time: string;
  category: TaskCategory;
  item_names: string[];
  is_automatic: boolean;
  completed: boolean;
}

export interface OverviewDragon {
  dragon_id: string;
  name: string;
  photo_base64?: string | null;
  age_category: AgeCategory;
  tasks: OverviewTask[];
}

export interface DailyOverview {
  date: string;
  day_of_week: DayOfWeek;
  dragons: OverviewDragon[];
}

export interface AppSettings {
  id: string;
  banner_image_base64?: string | null;
  banner_text?: string | null;
  updated_at: string;
}

export interface WeightEntry {
  id: string;
  dragon_id: string;
  weight_grams: number;
  note?: string | null;
  date: string;
  created_at: string;
}

export interface DatabaseExport {
  version: number;
  exported_at: string;
  dragons: any[];
  task_items: any[];
  times: any[];
  schedule_slots: any[];
  completions: any[];
  weight_entries: any[];
  app_settings: any[];
}
