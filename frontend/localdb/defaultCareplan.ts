/**
 * Built-in default bilingual (da/en) bearded dragon care plan, used by
 * "Reset & load care plan" and to auto-seed a brand-new install (when no
 * migration seed applies). Ported 1:1 from the previous backend's
 * services/careplan_seed.py.
 */
import { generateId, nowIso } from './idGen';
import type { DayOfWeek, AgeCategory, TaskCategory, ScheduleSlot, TaskItem, TimeSlotRecord } from './types';

interface DefaultTime {
  time: string;
  winter_time: string | null;
}

const TIMES: DefaultTime[] = [
  { time: '07:00', winter_time: '08:00' },
  { time: '08:30', winter_time: null },
  { time: '09:00', winter_time: null },
  { time: '16:30', winter_time: null },
  { time: '17:00', winter_time: null },
  { time: '18:00', winter_time: null },
  { time: '19:30', winter_time: null },
  { time: '20:00', winter_time: '19:35' },
  { time: '20:45', winter_time: '20:00' },
];

interface DefaultItemSpec {
  category: TaskCategory;
  da: string;
  en: string;
  auto: boolean;
}

const ITEMS: Record<string, DefaultItemSpec> = {
  insects_with_legs: { category: 'fodring', da: 'Insekter med ben', en: 'Insects with legs', auto: false },
  leafy_greens: { category: 'fodring', da: 'Bladgrønt', en: 'Leafy greens', auto: false },
  calcium_powder_no_d3: { category: 'fodring', da: 'Kalk-pudder (uden D3)', en: 'Calcium powder (no D3)', auto: false },
  multivitamin_powder_with_d3: { category: 'fodring', da: 'Multivitamin-pudder (med D3)', en: 'Multivitamin powder (with D3)', auto: false },
  check_refill_water: { category: 'pleje', da: 'Tjek og påfyld vand', en: 'Check & refill water', auto: false },
  check_temperature_humidity: { category: 'pleje', da: 'Tjek temperatur og fugtighed', en: 'Check temperature & humidity', auto: false },
  clean_terrarium: { category: 'pleje', da: 'Rengør terrarium', en: 'Clean terrarium', auto: false },
  check_behavior_health: { category: 'pleje', da: 'Tjek adfærd og sundhed', en: 'Check behavior & health', auto: false },
  uvb_light: { category: 'lys', da: 'UVB-lys', en: 'UVB light', auto: true },
  heat_lamp: { category: 'lys', da: 'Varmelampe', en: 'Heat lamp', auto: true },
  ceramic_night_heater_if_needed: { category: 'lys', da: 'Keramisk natvarmer (ved behov)', en: 'Ceramic night heater (if needed)', auto: false },
  legless_insects: { category: 'fodring', da: 'Insekter uden ben', en: 'Legless insects', auto: false },
  vegetables: { category: 'fodring', da: 'Grøntsager', en: 'Vegetables', auto: false },
  weekly_cleaning_and_disinfection: { category: 'pleje', da: 'Ugentlig rengøring og desinfektion.', en: 'Weekly cleaning and disinfection', auto: false },
  remove_feces: { category: 'pleje', da: 'Fjern afføring', en: 'Remove feces', auto: false },
  snack_legless_insects: { category: 'fodring', da: 'Snack - insekter uden ben', en: 'Snack legless insects', auto: false },
};

interface DefaultSlotSpec {
  age: AgeCategory;
  day: DayOfWeek;
  time: string;
  category: TaskCategory;
  items: string[];
  auto: boolean;
}

const SLOTS: DefaultSlotSpec[] = [
  { age: '2-4', day: 'mandag', time: '07:00', category: 'lys', items: ['uvb_light', 'heat_lamp'], auto: true },
  { age: '2-4', day: 'mandag', time: '08:30', category: 'fodring', items: ['insects_with_legs', 'leafy_greens', 'calcium_powder_no_d3'], auto: false },
  { age: '2-4', day: 'mandag', time: '16:30', category: 'fodring', items: ['leafy_greens', 'legless_insects'], auto: false },
  { age: '2-4', day: 'mandag', time: '18:00', category: 'pleje', items: ['check_refill_water', 'check_behavior_health', 'remove_feces'], auto: false },
  { age: '2-4', day: 'mandag', time: '20:45', category: 'lys', items: ['uvb_light', 'heat_lamp'], auto: true },
  { age: '2-4', day: 'tirsdag', time: '07:00', category: 'lys', items: ['uvb_light', 'heat_lamp'], auto: true },
  { age: '2-4', day: 'tirsdag', time: '08:30', category: 'fodring', items: ['insects_with_legs', 'leafy_greens', 'multivitamin_powder_with_d3'], auto: false },
  { age: '2-4', day: 'tirsdag', time: '16:30', category: 'fodring', items: ['insects_with_legs', 'calcium_powder_no_d3', 'leafy_greens'], auto: false },
  { age: '2-4', day: 'tirsdag', time: '18:00', category: 'pleje', items: ['check_refill_water', 'check_behavior_health', 'remove_feces'], auto: false },
  { age: '2-4', day: 'tirsdag', time: '20:00', category: 'lys', items: ['uvb_light', 'heat_lamp'], auto: true },
  { age: '2-4', day: 'onsdag', time: '07:00', category: 'lys', items: ['uvb_light', 'heat_lamp'], auto: true },
  { age: '2-4', day: 'onsdag', time: '08:30', category: 'fodring', items: ['insects_with_legs', 'leafy_greens', 'calcium_powder_no_d3'], auto: false },
  { age: '2-4', day: 'onsdag', time: '16:30', category: 'fodring', items: ['leafy_greens', 'legless_insects'], auto: false },
  { age: '2-4', day: 'onsdag', time: '18:00', category: 'pleje', items: ['check_refill_water', 'check_behavior_health', 'remove_feces'], auto: false },
  { age: '2-4', day: 'onsdag', time: '20:00', category: 'lys', items: ['uvb_light', 'heat_lamp'], auto: true },
  { age: '2-4', day: 'torsdag', time: '07:00', category: 'lys', items: ['uvb_light', 'heat_lamp'], auto: true },
  { age: '2-4', day: 'torsdag', time: '08:30', category: 'fodring', items: ['insects_with_legs', 'leafy_greens', 'multivitamin_powder_with_d3'], auto: false },
  { age: '2-4', day: 'torsdag', time: '16:30', category: 'fodring', items: ['insects_with_legs', 'calcium_powder_no_d3', 'leafy_greens'], auto: false },
  { age: '2-4', day: 'torsdag', time: '18:00', category: 'pleje', items: ['check_refill_water', 'check_behavior_health', 'remove_feces'], auto: false },
  { age: '2-4', day: 'torsdag', time: '20:00', category: 'lys', items: ['uvb_light', 'heat_lamp'], auto: true },
  { age: '2-4', day: 'fredag', time: '07:00', category: 'lys', items: ['uvb_light', 'heat_lamp'], auto: true },
  { age: '2-4', day: 'fredag', time: '08:30', category: 'fodring', items: ['insects_with_legs', 'leafy_greens', 'calcium_powder_no_d3'], auto: false },
  { age: '2-4', day: 'fredag', time: '16:30', category: 'fodring', items: ['insects_with_legs', 'leafy_greens'], auto: false },
  { age: '2-4', day: 'fredag', time: '18:00', category: 'pleje', items: ['check_refill_water', 'check_behavior_health', 'remove_feces'], auto: false },
  { age: '2-4', day: 'fredag', time: '20:00', category: 'lys', items: ['uvb_light', 'heat_lamp'], auto: true },
  { age: '2-4', day: 'lørdag', time: '07:00', category: 'lys', items: ['uvb_light', 'heat_lamp'], auto: true },
  { age: '2-4', day: 'lørdag', time: '08:30', category: 'fodring', items: ['insects_with_legs', 'leafy_greens', 'multivitamin_powder_with_d3'], auto: false },
  { age: '2-4', day: 'lørdag', time: '16:30', category: 'fodring', items: ['leafy_greens', 'legless_insects', 'multivitamin_powder_with_d3'], auto: false },
  { age: '2-4', day: 'lørdag', time: '18:00', category: 'pleje', items: ['check_refill_water', 'check_behavior_health', 'remove_feces'], auto: false },
  { age: '2-4', day: 'lørdag', time: '20:00', category: 'lys', items: ['uvb_light', 'heat_lamp'], auto: true },
  { age: '2-4', day: 'søndag', time: '07:00', category: 'lys', items: ['uvb_light', 'heat_lamp'], auto: true },
  { age: '2-4', day: 'søndag', time: '08:30', category: 'fodring', items: ['insects_with_legs', 'leafy_greens'], auto: false },
  { age: '2-4', day: 'søndag', time: '16:30', category: 'fodring', items: ['leafy_greens', 'legless_insects', 'calcium_powder_no_d3'], auto: false },
  { age: '2-4', day: 'søndag', time: '18:00', category: 'pleje', items: ['check_refill_water', 'check_behavior_health', 'remove_feces', 'weekly_cleaning_and_disinfection'], auto: false },
  { age: '2-4', day: 'søndag', time: '20:00', category: 'lys', items: ['uvb_light', 'heat_lamp'], auto: true },
  { age: '4-7', day: 'mandag', time: '07:00', category: 'lys', items: ['uvb_light', 'heat_lamp'], auto: true },
  { age: '4-7', day: 'mandag', time: '08:30', category: 'fodring', items: ['insects_with_legs', 'leafy_greens', 'calcium_powder_no_d3'], auto: false },
  { age: '4-7', day: 'mandag', time: '16:30', category: 'fodring', items: ['leafy_greens', 'legless_insects'], auto: false },
  { age: '4-7', day: 'mandag', time: '18:00', category: 'pleje', items: ['check_refill_water', 'check_behavior_health', 'remove_feces'], auto: false },
  { age: '4-7', day: 'mandag', time: '20:00', category: 'lys', items: ['uvb_light', 'heat_lamp'], auto: true },
  { age: '4-7', day: 'tirsdag', time: '07:00', category: 'lys', items: ['uvb_light', 'heat_lamp'], auto: true },
  { age: '4-7', day: 'tirsdag', time: '08:30', category: 'fodring', items: ['insects_with_legs', 'leafy_greens', 'multivitamin_powder_with_d3'], auto: false },
  { age: '4-7', day: 'tirsdag', time: '16:30', category: 'fodring', items: ['leafy_greens'], auto: false },
  { age: '4-7', day: 'tirsdag', time: '18:00', category: 'pleje', items: ['check_refill_water', 'check_behavior_health', 'remove_feces'], auto: false },
  { age: '4-7', day: 'tirsdag', time: '20:00', category: 'lys', items: ['uvb_light', 'heat_lamp'], auto: true },
  { age: '4-7', day: 'onsdag', time: '07:00', category: 'lys', items: ['uvb_light', 'heat_lamp'], auto: true },
  { age: '4-7', day: 'onsdag', time: '08:30', category: 'fodring', items: ['insects_with_legs', 'leafy_greens', 'calcium_powder_no_d3'], auto: false },
  { age: '4-7', day: 'onsdag', time: '16:30', category: 'fodring', items: ['leafy_greens', 'legless_insects'], auto: false },
  { age: '4-7', day: 'onsdag', time: '18:00', category: 'pleje', items: ['check_refill_water', 'check_behavior_health', 'remove_feces'], auto: false },
  { age: '4-7', day: 'onsdag', time: '20:00', category: 'lys', items: ['uvb_light', 'heat_lamp'], auto: true },
  { age: '4-7', day: 'torsdag', time: '07:00', category: 'lys', items: ['uvb_light', 'heat_lamp'], auto: true },
  { age: '4-7', day: 'torsdag', time: '08:30', category: 'fodring', items: ['insects_with_legs', 'leafy_greens', 'multivitamin_powder_with_d3'], auto: false },
  { age: '4-7', day: 'torsdag', time: '16:30', category: 'fodring', items: ['leafy_greens'], auto: false },
  { age: '4-7', day: 'torsdag', time: '18:00', category: 'pleje', items: ['check_refill_water', 'check_behavior_health', 'remove_feces'], auto: false },
  { age: '4-7', day: 'torsdag', time: '20:00', category: 'lys', items: ['uvb_light', 'heat_lamp'], auto: true },
  { age: '4-7', day: 'fredag', time: '07:00', category: 'lys', items: ['uvb_light', 'heat_lamp'], auto: true },
  { age: '4-7', day: 'fredag', time: '08:30', category: 'fodring', items: ['insects_with_legs', 'leafy_greens', 'calcium_powder_no_d3'], auto: false },
  { age: '4-7', day: 'fredag', time: '16:30', category: 'fodring', items: ['insects_with_legs', 'leafy_greens'], auto: false },
  { age: '4-7', day: 'fredag', time: '18:00', category: 'pleje', items: ['check_refill_water', 'check_behavior_health', 'remove_feces'], auto: false },
  { age: '4-7', day: 'fredag', time: '20:00', category: 'lys', items: ['uvb_light', 'heat_lamp'], auto: true },
  { age: '4-7', day: 'lørdag', time: '07:00', category: 'lys', items: ['uvb_light', 'heat_lamp'], auto: true },
  { age: '4-7', day: 'lørdag', time: '08:30', category: 'fodring', items: ['insects_with_legs', 'leafy_greens', 'multivitamin_powder_with_d3'], auto: false },
  { age: '4-7', day: 'lørdag', time: '16:30', category: 'fodring', items: ['leafy_greens'], auto: false },
  { age: '4-7', day: 'lørdag', time: '18:00', category: 'pleje', items: ['check_refill_water', 'check_behavior_health'], auto: false },
  { age: '4-7', day: 'lørdag', time: '20:00', category: 'lys', items: ['uvb_light', 'heat_lamp'], auto: true },
  { age: '4-7', day: 'søndag', time: '07:00', category: 'lys', items: ['uvb_light', 'heat_lamp'], auto: true },
  { age: '4-7', day: 'søndag', time: '08:30', category: 'fodring', items: ['insects_with_legs', 'leafy_greens'], auto: false },
  { age: '4-7', day: 'søndag', time: '16:30', category: 'fodring', items: ['leafy_greens', 'legless_insects', 'calcium_powder_no_d3'], auto: false },
  { age: '4-7', day: 'søndag', time: '18:00', category: 'pleje', items: ['check_refill_water', 'check_behavior_health', 'remove_feces', 'weekly_cleaning_and_disinfection'], auto: false },
  { age: '4-7', day: 'søndag', time: '20:00', category: 'lys', items: ['uvb_light', 'heat_lamp'], auto: true },
  { age: '7-12', day: 'mandag', time: '07:00', category: 'lys', items: ['uvb_light', 'heat_lamp'], auto: true },
  { age: '7-12', day: 'mandag', time: '08:30', category: 'fodring', items: ['insects_with_legs', 'leafy_greens', 'calcium_powder_no_d3', 'vegetables'], auto: false },
  { age: '7-12', day: 'mandag', time: '16:30', category: 'fodring', items: ['leafy_greens'], auto: false },
  { age: '7-12', day: 'mandag', time: '18:00', category: 'pleje', items: ['check_refill_water', 'check_behavior_health', 'remove_feces'], auto: false },
  { age: '7-12', day: 'mandag', time: '20:00', category: 'lys', items: ['uvb_light', 'heat_lamp'], auto: true },
  { age: '7-12', day: 'tirsdag', time: '07:00', category: 'lys', items: ['uvb_light', 'heat_lamp'], auto: true },
  { age: '7-12', day: 'tirsdag', time: '08:30', category: 'fodring', items: ['insects_with_legs', 'leafy_greens', 'multivitamin_powder_with_d3'], auto: false },
  { age: '7-12', day: 'tirsdag', time: '16:30', category: 'fodring', items: ['leafy_greens'], auto: false },
  { age: '7-12', day: 'tirsdag', time: '18:00', category: 'pleje', items: ['check_refill_water', 'check_behavior_health', 'remove_feces'], auto: false },
  { age: '7-12', day: 'tirsdag', time: '20:00', category: 'lys', items: ['uvb_light', 'heat_lamp'], auto: true },
  { age: '7-12', day: 'onsdag', time: '07:00', category: 'lys', items: ['uvb_light', 'heat_lamp'], auto: true },
  { age: '7-12', day: 'onsdag', time: '08:30', category: 'fodring', items: ['leafy_greens', 'calcium_powder_no_d3', 'legless_insects'], auto: false },
  { age: '7-12', day: 'onsdag', time: '16:30', category: 'fodring', items: ['leafy_greens'], auto: false },
  { age: '7-12', day: 'onsdag', time: '18:00', category: 'pleje', items: ['check_refill_water', 'check_behavior_health', 'remove_feces'], auto: false },
  { age: '7-12', day: 'onsdag', time: '20:00', category: 'lys', items: ['uvb_light', 'heat_lamp'], auto: true },
  { age: '7-12', day: 'torsdag', time: '07:00', category: 'lys', items: ['uvb_light', 'heat_lamp'], auto: true },
  { age: '7-12', day: 'torsdag', time: '08:30', category: 'fodring', items: ['insects_with_legs', 'leafy_greens'], auto: false },
  { age: '7-12', day: 'torsdag', time: '16:30', category: 'fodring', items: ['leafy_greens'], auto: false },
  { age: '7-12', day: 'torsdag', time: '18:00', category: 'pleje', items: ['check_refill_water', 'check_behavior_health', 'remove_feces'], auto: false },
  { age: '7-12', day: 'torsdag', time: '20:00', category: 'lys', items: ['uvb_light', 'heat_lamp'], auto: true },
  { age: '7-12', day: 'fredag', time: '07:00', category: 'lys', items: ['uvb_light', 'heat_lamp'], auto: true },
  { age: '7-12', day: 'fredag', time: '08:30', category: 'fodring', items: ['insects_with_legs', 'leafy_greens', 'calcium_powder_no_d3'], auto: false },
  { age: '7-12', day: 'fredag', time: '16:30', category: 'fodring', items: ['leafy_greens'], auto: false },
  { age: '7-12', day: 'fredag', time: '18:00', category: 'pleje', items: ['check_refill_water', 'check_behavior_health', 'remove_feces'], auto: false },
  { age: '7-12', day: 'fredag', time: '20:00', category: 'lys', items: ['uvb_light', 'heat_lamp'], auto: true },
  { age: '7-12', day: 'lørdag', time: '07:00', category: 'lys', items: ['uvb_light', 'heat_lamp'], auto: true },
  { age: '7-12', day: 'lørdag', time: '08:30', category: 'fodring', items: ['leafy_greens', 'multivitamin_powder_with_d3', 'legless_insects'], auto: false },
  { age: '7-12', day: 'lørdag', time: '16:30', category: 'fodring', items: ['leafy_greens'], auto: false },
  { age: '7-12', day: 'lørdag', time: '18:00', category: 'pleje', items: ['check_refill_water', 'check_behavior_health'], auto: false },
  { age: '7-12', day: 'lørdag', time: '20:00', category: 'lys', items: ['uvb_light', 'heat_lamp'], auto: true },
  { age: '7-12', day: 'søndag', time: '07:00', category: 'lys', items: ['uvb_light', 'heat_lamp'], auto: true },
  { age: '7-12', day: 'søndag', time: '08:30', category: 'fodring', items: ['insects_with_legs', 'leafy_greens'], auto: false },
  { age: '7-12', day: 'søndag', time: '16:30', category: 'fodring', items: ['leafy_greens'], auto: false },
  { age: '7-12', day: 'søndag', time: '18:00', category: 'pleje', items: ['check_refill_water', 'check_behavior_health', 'remove_feces', 'weekly_cleaning_and_disinfection'], auto: false },
  { age: '7-12', day: 'søndag', time: '20:00', category: 'lys', items: ['uvb_light', 'heat_lamp'], auto: true },
  { age: '12+', day: 'mandag', time: '07:00', category: 'lys', items: ['uvb_light', 'heat_lamp'], auto: true },
  { age: '12+', day: 'mandag', time: '08:30', category: 'fodring', items: ['leafy_greens', 'vegetables', 'multivitamin_powder_with_d3'], auto: false },
  { age: '12+', day: 'mandag', time: '16:30', category: 'fodring', items: ['leafy_greens'], auto: false },
  { age: '12+', day: 'mandag', time: '18:00', category: 'pleje', items: ['check_refill_water', 'check_behavior_health', 'remove_feces'], auto: false },
  { age: '12+', day: 'mandag', time: '19:30', category: 'fodring', items: ['legless_insects'], auto: false },
  { age: '12+', day: 'mandag', time: '20:00', category: 'lys', items: ['uvb_light', 'heat_lamp'], auto: true },
  { age: '12+', day: 'tirsdag', time: '07:00', category: 'lys', items: ['uvb_light', 'heat_lamp'], auto: true },
  { age: '12+', day: 'tirsdag', time: '08:30', category: 'fodring', items: ['leafy_greens'], auto: false },
  { age: '12+', day: 'tirsdag', time: '16:30', category: 'fodring', items: ['leafy_greens'], auto: false },
  { age: '12+', day: 'tirsdag', time: '18:00', category: 'pleje', items: ['check_refill_water', 'check_behavior_health', 'remove_feces'], auto: false },
  { age: '12+', day: 'tirsdag', time: '20:00', category: 'lys', items: ['uvb_light', 'heat_lamp'], auto: true },
  { age: '12+', day: 'onsdag', time: '07:00', category: 'lys', items: ['uvb_light', 'heat_lamp'], auto: true },
  { age: '12+', day: 'onsdag', time: '08:30', category: 'fodring', items: ['leafy_greens', 'vegetables', 'insects_with_legs', 'calcium_powder_no_d3'], auto: false },
  { age: '12+', day: 'onsdag', time: '16:30', category: 'fodring', items: ['leafy_greens'], auto: false },
  { age: '12+', day: 'onsdag', time: '18:00', category: 'pleje', items: ['check_refill_water', 'check_behavior_health', 'remove_feces'], auto: false },
  { age: '12+', day: 'onsdag', time: '20:00', category: 'lys', items: ['uvb_light', 'heat_lamp'], auto: true },
  { age: '12+', day: 'torsdag', time: '07:00', category: 'lys', items: ['uvb_light', 'heat_lamp'], auto: true },
  { age: '12+', day: 'torsdag', time: '08:30', category: 'fodring', items: ['leafy_greens'], auto: false },
  { age: '12+', day: 'torsdag', time: '16:30', category: 'fodring', items: ['leafy_greens'], auto: false },
  { age: '12+', day: 'torsdag', time: '18:00', category: 'pleje', items: ['check_refill_water', 'check_behavior_health', 'remove_feces'], auto: false },
  { age: '12+', day: 'torsdag', time: '19:30', category: 'fodring', items: ['snack_legless_insects'], auto: false },
  { age: '12+', day: 'torsdag', time: '20:00', category: 'lys', items: ['uvb_light', 'heat_lamp'], auto: true },
  { age: '12+', day: 'fredag', time: '07:00', category: 'lys', items: ['uvb_light', 'heat_lamp'], auto: true },
  { age: '12+', day: 'fredag', time: '08:30', category: 'fodring', items: ['leafy_greens', 'vegetables', 'multivitamin_powder_with_d3'], auto: false },
  { age: '12+', day: 'fredag', time: '16:30', category: 'fodring', items: ['leafy_greens'], auto: false },
  { age: '12+', day: 'fredag', time: '18:00', category: 'pleje', items: ['check_refill_water', 'check_behavior_health', 'remove_feces'], auto: false },
  { age: '12+', day: 'fredag', time: '20:00', category: 'lys', items: ['uvb_light', 'heat_lamp'], auto: true },
  { age: '12+', day: 'lørdag', time: '07:00', category: 'lys', items: ['uvb_light', 'heat_lamp'], auto: true },
  { age: '12+', day: 'lørdag', time: '08:30', category: 'fodring', items: ['insects_with_legs', 'calcium_powder_no_d3'], auto: false },
  { age: '12+', day: 'lørdag', time: '16:30', category: 'fodring', items: ['leafy_greens'], auto: false },
  { age: '12+', day: 'lørdag', time: '18:00', category: 'pleje', items: ['check_refill_water', 'check_behavior_health'], auto: false },
  { age: '12+', day: 'lørdag', time: '20:00', category: 'lys', items: ['uvb_light', 'heat_lamp'], auto: true },
  { age: '12+', day: 'søndag', time: '07:00', category: 'lys', items: ['uvb_light', 'heat_lamp'], auto: true },
  { age: '12+', day: 'søndag', time: '08:30', category: 'fodring', items: ['leafy_greens'], auto: false },
  { age: '12+', day: 'søndag', time: '16:30', category: 'fodring', items: ['leafy_greens'], auto: false },
  { age: '12+', day: 'søndag', time: '18:00', category: 'pleje', items: ['check_refill_water', 'check_behavior_health', 'remove_feces', 'weekly_cleaning_and_disinfection'], auto: false },
  { age: '12+', day: 'søndag', time: '20:00', category: 'lys', items: ['uvb_light', 'heat_lamp'], auto: true },
];

export interface BuiltCareplan {
  times: TimeSlotRecord[];
  taskItems: TaskItem[];
  scheduleSlots: ScheduleSlot[];
}

/** Builds fresh Times/TaskItems/ScheduleSlots documents (with new generated
 * ids) for the default care plan - mirrors the old backend's
 * apply_default_careplan(). */
export function buildDefaultCareplan(): BuiltCareplan {
  const timeIdMap: Record<string, string> = {};
  const times: TimeSlotRecord[] = TIMES.map((t) => {
    const id = generateId();
    timeIdMap[t.time] = id;
    return { id, time: t.time, winter_time: t.winter_time, created_at: nowIso() };
  });

  const itemIdMap: Record<string, string> = {};
  const taskItems: TaskItem[] = Object.entries(ITEMS).map(([key, spec]) => {
    const id = generateId();
    itemIdMap[key] = id;
    return {
      id,
      category: spec.category,
      name: spec.en,
      name_da: spec.da,
      name_en: spec.en,
      is_automatic: spec.auto,
      created_at: nowIso(),
    };
  });

  const scheduleSlots: ScheduleSlot[] = SLOTS.map((s) => ({
    id: generateId(),
    age_category: s.age,
    day_of_week: s.day,
    time_id: timeIdMap[s.time],
    category: s.category,
    item_ids: s.items.map((k) => itemIdMap[k]),
    is_automatic: s.auto,
    created_at: nowIso(),
  }));

  return { times, taskItems, scheduleSlots };
}
