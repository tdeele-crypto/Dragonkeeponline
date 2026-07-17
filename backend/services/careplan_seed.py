"""Built-in default bearded dragon care plan (bilingual da/en) used by the
Admin > 'Reset & load care plan' feature, and auto-seeded on a fresh install.

CAPTURED FROM THE LIVE APP by scripts/capture_default_careplan.py - this is
the user's own customized plan, not a generic template. Editing the app's
Times/Feeding/Care/Light&Heat/Schedules again and re-running that script will
regenerate this file.
"""
from typing import List, Dict, Any

DAYS: List[str] = ['mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag', 'lørdag', 'søndag']
AGE_CATEGORIES: List[str] = ['2-4', '4-7', '7-12', '12+']

# Each entry: {"time": "HH:MM", "winter_time": "HH:MM" | None}
TIMES: List[Dict[str, Any]] = [{'time': '07:00', 'winter_time': '08:00'}, {'time': '08:30', 'winter_time': None}, {'time': '09:00', 'winter_time': None}, {'time': '16:30', 'winter_time': None}, {'time': '17:00', 'winter_time': None}, {'time': '18:00', 'winter_time': None}, {'time': '19:30', 'winter_time': None}, {'time': '20:00', 'winter_time': '19:35'}, {'time': '20:45', 'winter_time': '20:00'}]

ITEMS: Dict[str, Dict[str, Any]] = {
    "insects_with_legs": {"category": "fodring", "da": 'Insekter med ben', "en": 'Insects with legs', "auto": False},
    "leafy_greens": {"category": "fodring", "da": 'Bladgrønt', "en": 'Leafy greens', "auto": False},
    "calcium_powder_no_d3": {"category": "fodring", "da": 'Kalk-pudder (uden D3)', "en": 'Calcium powder (no D3)', "auto": False},
    "multivitamin_powder_with_d3": {"category": "fodring", "da": 'Multivitamin-pudder (med D3)', "en": 'Multivitamin powder (with D3)', "auto": False},
    "check_refill_water": {"category": "pleje", "da": 'Tjek og påfyld vand', "en": 'Check & refill water', "auto": False},
    "check_temperature_humidity": {"category": "pleje", "da": 'Tjek temperatur og fugtighed', "en": 'Check temperature & humidity', "auto": False},
    "clean_terrarium": {"category": "pleje", "da": 'Rengør terrarium', "en": 'Clean terrarium', "auto": False},
    "check_behavior_health": {"category": "pleje", "da": 'Tjek adfærd og sundhed', "en": 'Check behavior & health', "auto": False},
    "uvb_light": {"category": "lys", "da": 'UVB-lys', "en": 'UVB light', "auto": True},
    "heat_lamp": {"category": "lys", "da": 'Varmelampe', "en": 'Heat lamp', "auto": True},
    "ceramic_night_heater_if_needed": {"category": "lys", "da": 'Keramisk natvarmer (ved behov)', "en": 'Ceramic night heater (if needed)', "auto": False},
    "legless_insects": {"category": "fodring", "da": 'Insekter uden ben', "en": 'Legless insects', "auto": False},
    "vegetables": {"category": "fodring", "da": 'Grøntsager', "en": 'Vegetables', "auto": False},
    "weekly_cleaning_and_disinfection": {"category": "pleje", "da": 'Ugentlig rengøring og desinfektion.', "en": 'Weekly cleaning and disinfection', "auto": False},
    "remove_feces": {"category": "pleje", "da": 'Fjern afføring', "en": 'Remove feces', "auto": False},
    "snack_legless_insects": {"category": "fodring", "da": 'Snack - insekter uden ben', "en": 'Snack legless insects', "auto": False},
}

_SLOTS: List[Dict[str, Any]] = [
    {"age": "2-4", "day": "mandag", "time": "07:00", "category": "lys", "items": ["uvb_light", "heat_lamp"], "auto": True},
    {"age": "2-4", "day": "mandag", "time": "08:30", "category": "fodring", "items": ["insects_with_legs", "leafy_greens", "calcium_powder_no_d3"], "auto": False},
    {"age": "2-4", "day": "mandag", "time": "16:30", "category": "fodring", "items": ["leafy_greens", "legless_insects"], "auto": False},
    {"age": "2-4", "day": "mandag", "time": "18:00", "category": "pleje", "items": ["check_refill_water", "check_behavior_health", "remove_feces"], "auto": False},
    {"age": "2-4", "day": "mandag", "time": "20:45", "category": "lys", "items": ["uvb_light", "heat_lamp"], "auto": True},
    {"age": "2-4", "day": "tirsdag", "time": "07:00", "category": "lys", "items": ["uvb_light", "heat_lamp"], "auto": True},
    {"age": "2-4", "day": "tirsdag", "time": "08:30", "category": "fodring", "items": ["insects_with_legs", "leafy_greens", "multivitamin_powder_with_d3"], "auto": False},
    {"age": "2-4", "day": "tirsdag", "time": "16:30", "category": "fodring", "items": ["insects_with_legs", "calcium_powder_no_d3", "leafy_greens"], "auto": False},
    {"age": "2-4", "day": "tirsdag", "time": "18:00", "category": "pleje", "items": ["check_refill_water", "check_behavior_health", "remove_feces"], "auto": False},
    {"age": "2-4", "day": "tirsdag", "time": "20:00", "category": "lys", "items": ["uvb_light", "heat_lamp"], "auto": True},
    {"age": "2-4", "day": "onsdag", "time": "07:00", "category": "lys", "items": ["uvb_light", "heat_lamp"], "auto": True},
    {"age": "2-4", "day": "onsdag", "time": "08:30", "category": "fodring", "items": ["insects_with_legs", "leafy_greens", "calcium_powder_no_d3"], "auto": False},
    {"age": "2-4", "day": "onsdag", "time": "16:30", "category": "fodring", "items": ["leafy_greens", "legless_insects"], "auto": False},
    {"age": "2-4", "day": "onsdag", "time": "18:00", "category": "pleje", "items": ["check_refill_water", "check_behavior_health", "remove_feces"], "auto": False},
    {"age": "2-4", "day": "onsdag", "time": "20:00", "category": "lys", "items": ["uvb_light", "heat_lamp"], "auto": True},
    {"age": "2-4", "day": "torsdag", "time": "07:00", "category": "lys", "items": ["uvb_light", "heat_lamp"], "auto": True},
    {"age": "2-4", "day": "torsdag", "time": "08:30", "category": "fodring", "items": ["insects_with_legs", "leafy_greens", "multivitamin_powder_with_d3"], "auto": False},
    {"age": "2-4", "day": "torsdag", "time": "16:30", "category": "fodring", "items": ["insects_with_legs", "calcium_powder_no_d3", "leafy_greens"], "auto": False},
    {"age": "2-4", "day": "torsdag", "time": "18:00", "category": "pleje", "items": ["check_refill_water", "check_behavior_health", "remove_feces"], "auto": False},
    {"age": "2-4", "day": "torsdag", "time": "20:00", "category": "lys", "items": ["uvb_light", "heat_lamp"], "auto": True},
    {"age": "2-4", "day": "fredag", "time": "07:00", "category": "lys", "items": ["uvb_light", "heat_lamp"], "auto": True},
    {"age": "2-4", "day": "fredag", "time": "08:30", "category": "fodring", "items": ["insects_with_legs", "leafy_greens", "calcium_powder_no_d3"], "auto": False},
    {"age": "2-4", "day": "fredag", "time": "16:30", "category": "fodring", "items": ["insects_with_legs", "leafy_greens"], "auto": False},
    {"age": "2-4", "day": "fredag", "time": "18:00", "category": "pleje", "items": ["check_refill_water", "check_behavior_health", "remove_feces"], "auto": False},
    {"age": "2-4", "day": "fredag", "time": "20:00", "category": "lys", "items": ["uvb_light", "heat_lamp"], "auto": True},
    {"age": "2-4", "day": "lørdag", "time": "07:00", "category": "lys", "items": ["uvb_light", "heat_lamp"], "auto": True},
    {"age": "2-4", "day": "lørdag", "time": "08:30", "category": "fodring", "items": ["insects_with_legs", "leafy_greens", "multivitamin_powder_with_d3"], "auto": False},
    {"age": "2-4", "day": "lørdag", "time": "16:30", "category": "fodring", "items": ["leafy_greens", "legless_insects", "multivitamin_powder_with_d3"], "auto": False},
    {"age": "2-4", "day": "lørdag", "time": "18:00", "category": "pleje", "items": ["check_refill_water", "check_behavior_health", "remove_feces"], "auto": False},
    {"age": "2-4", "day": "lørdag", "time": "20:00", "category": "lys", "items": ["uvb_light", "heat_lamp"], "auto": True},
    {"age": "2-4", "day": "søndag", "time": "07:00", "category": "lys", "items": ["uvb_light", "heat_lamp"], "auto": True},
    {"age": "2-4", "day": "søndag", "time": "08:30", "category": "fodring", "items": ["insects_with_legs", "leafy_greens"], "auto": False},
    {"age": "2-4", "day": "søndag", "time": "16:30", "category": "fodring", "items": ["leafy_greens", "legless_insects", "calcium_powder_no_d3"], "auto": False},
    {"age": "2-4", "day": "søndag", "time": "18:00", "category": "pleje", "items": ["check_refill_water", "check_behavior_health", "remove_feces", "weekly_cleaning_and_disinfection"], "auto": False},
    {"age": "2-4", "day": "søndag", "time": "20:00", "category": "lys", "items": ["uvb_light", "heat_lamp"], "auto": True},
    {"age": "4-7", "day": "mandag", "time": "07:00", "category": "lys", "items": ["uvb_light", "heat_lamp"], "auto": True},
    {"age": "4-7", "day": "mandag", "time": "08:30", "category": "fodring", "items": ["insects_with_legs", "leafy_greens", "calcium_powder_no_d3"], "auto": False},
    {"age": "4-7", "day": "mandag", "time": "16:30", "category": "fodring", "items": ["leafy_greens", "legless_insects"], "auto": False},
    {"age": "4-7", "day": "mandag", "time": "18:00", "category": "pleje", "items": ["check_refill_water", "check_behavior_health", "remove_feces"], "auto": False},
    {"age": "4-7", "day": "mandag", "time": "20:00", "category": "lys", "items": ["uvb_light", "heat_lamp"], "auto": True},
    {"age": "4-7", "day": "tirsdag", "time": "07:00", "category": "lys", "items": ["uvb_light", "heat_lamp"], "auto": True},
    {"age": "4-7", "day": "tirsdag", "time": "08:30", "category": "fodring", "items": ["insects_with_legs", "leafy_greens", "multivitamin_powder_with_d3"], "auto": False},
    {"age": "4-7", "day": "tirsdag", "time": "16:30", "category": "fodring", "items": ["leafy_greens"], "auto": False},
    {"age": "4-7", "day": "tirsdag", "time": "18:00", "category": "pleje", "items": ["check_refill_water", "check_behavior_health", "remove_feces"], "auto": False},
    {"age": "4-7", "day": "tirsdag", "time": "20:00", "category": "lys", "items": ["uvb_light", "heat_lamp"], "auto": True},
    {"age": "4-7", "day": "onsdag", "time": "07:00", "category": "lys", "items": ["uvb_light", "heat_lamp"], "auto": True},
    {"age": "4-7", "day": "onsdag", "time": "08:30", "category": "fodring", "items": ["insects_with_legs", "leafy_greens", "calcium_powder_no_d3"], "auto": False},
    {"age": "4-7", "day": "onsdag", "time": "16:30", "category": "fodring", "items": ["leafy_greens", "legless_insects"], "auto": False},
    {"age": "4-7", "day": "onsdag", "time": "18:00", "category": "pleje", "items": ["check_refill_water", "check_behavior_health", "remove_feces"], "auto": False},
    {"age": "4-7", "day": "onsdag", "time": "20:00", "category": "lys", "items": ["uvb_light", "heat_lamp"], "auto": True},
    {"age": "4-7", "day": "torsdag", "time": "07:00", "category": "lys", "items": ["uvb_light", "heat_lamp"], "auto": True},
    {"age": "4-7", "day": "torsdag", "time": "08:30", "category": "fodring", "items": ["insects_with_legs", "leafy_greens", "multivitamin_powder_with_d3"], "auto": False},
    {"age": "4-7", "day": "torsdag", "time": "16:30", "category": "fodring", "items": ["leafy_greens"], "auto": False},
    {"age": "4-7", "day": "torsdag", "time": "18:00", "category": "pleje", "items": ["check_refill_water", "check_behavior_health", "remove_feces"], "auto": False},
    {"age": "4-7", "day": "torsdag", "time": "20:00", "category": "lys", "items": ["uvb_light", "heat_lamp"], "auto": True},
    {"age": "4-7", "day": "fredag", "time": "07:00", "category": "lys", "items": ["uvb_light", "heat_lamp"], "auto": True},
    {"age": "4-7", "day": "fredag", "time": "08:30", "category": "fodring", "items": ["insects_with_legs", "leafy_greens", "calcium_powder_no_d3"], "auto": False},
    {"age": "4-7", "day": "fredag", "time": "16:30", "category": "fodring", "items": ["insects_with_legs", "leafy_greens"], "auto": False},
    {"age": "4-7", "day": "fredag", "time": "18:00", "category": "pleje", "items": ["check_refill_water", "check_behavior_health", "remove_feces"], "auto": False},
    {"age": "4-7", "day": "fredag", "time": "20:00", "category": "lys", "items": ["uvb_light", "heat_lamp"], "auto": True},
    {"age": "4-7", "day": "lørdag", "time": "07:00", "category": "lys", "items": ["uvb_light", "heat_lamp"], "auto": True},
    {"age": "4-7", "day": "lørdag", "time": "08:30", "category": "fodring", "items": ["insects_with_legs", "leafy_greens", "multivitamin_powder_with_d3"], "auto": False},
    {"age": "4-7", "day": "lørdag", "time": "16:30", "category": "fodring", "items": ["leafy_greens"], "auto": False},
    {"age": "4-7", "day": "lørdag", "time": "18:00", "category": "pleje", "items": ["check_refill_water", "check_behavior_health"], "auto": False},
    {"age": "4-7", "day": "lørdag", "time": "20:00", "category": "lys", "items": ["uvb_light", "heat_lamp"], "auto": True},
    {"age": "4-7", "day": "søndag", "time": "07:00", "category": "lys", "items": ["uvb_light", "heat_lamp"], "auto": True},
    {"age": "4-7", "day": "søndag", "time": "08:30", "category": "fodring", "items": ["insects_with_legs", "leafy_greens"], "auto": False},
    {"age": "4-7", "day": "søndag", "time": "16:30", "category": "fodring", "items": ["leafy_greens", "legless_insects", "calcium_powder_no_d3"], "auto": False},
    {"age": "4-7", "day": "søndag", "time": "18:00", "category": "pleje", "items": ["check_refill_water", "check_behavior_health", "remove_feces", "weekly_cleaning_and_disinfection"], "auto": False},
    {"age": "4-7", "day": "søndag", "time": "20:00", "category": "lys", "items": ["uvb_light", "heat_lamp"], "auto": True},
    {"age": "7-12", "day": "mandag", "time": "07:00", "category": "lys", "items": ["uvb_light", "heat_lamp"], "auto": True},
    {"age": "7-12", "day": "mandag", "time": "08:30", "category": "fodring", "items": ["insects_with_legs", "leafy_greens", "calcium_powder_no_d3", "vegetables"], "auto": False},
    {"age": "7-12", "day": "mandag", "time": "16:30", "category": "fodring", "items": ["leafy_greens"], "auto": False},
    {"age": "7-12", "day": "mandag", "time": "18:00", "category": "pleje", "items": ["check_refill_water", "check_behavior_health", "remove_feces"], "auto": False},
    {"age": "7-12", "day": "mandag", "time": "20:00", "category": "lys", "items": ["uvb_light", "heat_lamp"], "auto": True},
    {"age": "7-12", "day": "tirsdag", "time": "07:00", "category": "lys", "items": ["uvb_light", "heat_lamp"], "auto": True},
    {"age": "7-12", "day": "tirsdag", "time": "08:30", "category": "fodring", "items": ["insects_with_legs", "leafy_greens", "multivitamin_powder_with_d3"], "auto": False},
    {"age": "7-12", "day": "tirsdag", "time": "16:30", "category": "fodring", "items": ["leafy_greens"], "auto": False},
    {"age": "7-12", "day": "tirsdag", "time": "18:00", "category": "pleje", "items": ["check_refill_water", "check_behavior_health", "remove_feces"], "auto": False},
    {"age": "7-12", "day": "tirsdag", "time": "20:00", "category": "lys", "items": ["uvb_light", "heat_lamp"], "auto": True},
    {"age": "7-12", "day": "onsdag", "time": "07:00", "category": "lys", "items": ["uvb_light", "heat_lamp"], "auto": True},
    {"age": "7-12", "day": "onsdag", "time": "08:30", "category": "fodring", "items": ["leafy_greens", "calcium_powder_no_d3", "legless_insects"], "auto": False},
    {"age": "7-12", "day": "onsdag", "time": "16:30", "category": "fodring", "items": ["leafy_greens"], "auto": False},
    {"age": "7-12", "day": "onsdag", "time": "18:00", "category": "pleje", "items": ["check_refill_water", "check_behavior_health", "remove_feces"], "auto": False},
    {"age": "7-12", "day": "onsdag", "time": "20:00", "category": "lys", "items": ["uvb_light", "heat_lamp"], "auto": True},
    {"age": "7-12", "day": "torsdag", "time": "07:00", "category": "lys", "items": ["uvb_light", "heat_lamp"], "auto": True},
    {"age": "7-12", "day": "torsdag", "time": "08:30", "category": "fodring", "items": ["insects_with_legs", "leafy_greens"], "auto": False},
    {"age": "7-12", "day": "torsdag", "time": "16:30", "category": "fodring", "items": ["leafy_greens"], "auto": False},
    {"age": "7-12", "day": "torsdag", "time": "18:00", "category": "pleje", "items": ["check_refill_water", "check_behavior_health", "remove_feces"], "auto": False},
    {"age": "7-12", "day": "torsdag", "time": "20:00", "category": "lys", "items": ["uvb_light", "heat_lamp"], "auto": True},
    {"age": "7-12", "day": "fredag", "time": "07:00", "category": "lys", "items": ["uvb_light", "heat_lamp"], "auto": True},
    {"age": "7-12", "day": "fredag", "time": "08:30", "category": "fodring", "items": ["insects_with_legs", "leafy_greens", "calcium_powder_no_d3"], "auto": False},
    {"age": "7-12", "day": "fredag", "time": "16:30", "category": "fodring", "items": ["leafy_greens"], "auto": False},
    {"age": "7-12", "day": "fredag", "time": "18:00", "category": "pleje", "items": ["check_refill_water", "check_behavior_health", "remove_feces"], "auto": False},
    {"age": "7-12", "day": "fredag", "time": "20:00", "category": "lys", "items": ["uvb_light", "heat_lamp"], "auto": True},
    {"age": "7-12", "day": "lørdag", "time": "07:00", "category": "lys", "items": ["uvb_light", "heat_lamp"], "auto": True},
    {"age": "7-12", "day": "lørdag", "time": "08:30", "category": "fodring", "items": ["leafy_greens", "multivitamin_powder_with_d3", "legless_insects"], "auto": False},
    {"age": "7-12", "day": "lørdag", "time": "16:30", "category": "fodring", "items": ["leafy_greens"], "auto": False},
    {"age": "7-12", "day": "lørdag", "time": "18:00", "category": "pleje", "items": ["check_refill_water", "check_behavior_health"], "auto": False},
    {"age": "7-12", "day": "lørdag", "time": "20:00", "category": "lys", "items": ["uvb_light", "heat_lamp"], "auto": True},
    {"age": "7-12", "day": "søndag", "time": "07:00", "category": "lys", "items": ["uvb_light", "heat_lamp"], "auto": True},
    {"age": "7-12", "day": "søndag", "time": "08:30", "category": "fodring", "items": ["insects_with_legs", "leafy_greens"], "auto": False},
    {"age": "7-12", "day": "søndag", "time": "16:30", "category": "fodring", "items": ["leafy_greens"], "auto": False},
    {"age": "7-12", "day": "søndag", "time": "18:00", "category": "pleje", "items": ["check_refill_water", "check_behavior_health", "remove_feces", "weekly_cleaning_and_disinfection"], "auto": False},
    {"age": "7-12", "day": "søndag", "time": "20:00", "category": "lys", "items": ["uvb_light", "heat_lamp"], "auto": True},
    {"age": "12+", "day": "mandag", "time": "07:00", "category": "lys", "items": ["uvb_light", "heat_lamp"], "auto": True},
    {"age": "12+", "day": "mandag", "time": "08:30", "category": "fodring", "items": ["leafy_greens", "vegetables", "multivitamin_powder_with_d3"], "auto": False},
    {"age": "12+", "day": "mandag", "time": "16:30", "category": "fodring", "items": ["leafy_greens"], "auto": False},
    {"age": "12+", "day": "mandag", "time": "18:00", "category": "pleje", "items": ["check_refill_water", "check_behavior_health", "remove_feces"], "auto": False},
    {"age": "12+", "day": "mandag", "time": "19:30", "category": "fodring", "items": ["legless_insects"], "auto": False},
    {"age": "12+", "day": "mandag", "time": "20:00", "category": "lys", "items": ["uvb_light", "heat_lamp"], "auto": True},
    {"age": "12+", "day": "tirsdag", "time": "07:00", "category": "lys", "items": ["uvb_light", "heat_lamp"], "auto": True},
    {"age": "12+", "day": "tirsdag", "time": "08:30", "category": "fodring", "items": ["leafy_greens"], "auto": False},
    {"age": "12+", "day": "tirsdag", "time": "16:30", "category": "fodring", "items": ["leafy_greens"], "auto": False},
    {"age": "12+", "day": "tirsdag", "time": "18:00", "category": "pleje", "items": ["check_refill_water", "check_behavior_health", "remove_feces"], "auto": False},
    {"age": "12+", "day": "tirsdag", "time": "20:00", "category": "lys", "items": ["uvb_light", "heat_lamp"], "auto": True},
    {"age": "12+", "day": "onsdag", "time": "07:00", "category": "lys", "items": ["uvb_light", "heat_lamp"], "auto": True},
    {"age": "12+", "day": "onsdag", "time": "08:30", "category": "fodring", "items": ["leafy_greens", "vegetables", "insects_with_legs", "calcium_powder_no_d3"], "auto": False},
    {"age": "12+", "day": "onsdag", "time": "16:30", "category": "fodring", "items": ["leafy_greens"], "auto": False},
    {"age": "12+", "day": "onsdag", "time": "18:00", "category": "pleje", "items": ["check_refill_water", "check_behavior_health", "remove_feces"], "auto": False},
    {"age": "12+", "day": "onsdag", "time": "20:00", "category": "lys", "items": ["uvb_light", "heat_lamp"], "auto": True},
    {"age": "12+", "day": "torsdag", "time": "07:00", "category": "lys", "items": ["uvb_light", "heat_lamp"], "auto": True},
    {"age": "12+", "day": "torsdag", "time": "08:30", "category": "fodring", "items": ["leafy_greens"], "auto": False},
    {"age": "12+", "day": "torsdag", "time": "16:30", "category": "fodring", "items": ["leafy_greens"], "auto": False},
    {"age": "12+", "day": "torsdag", "time": "18:00", "category": "pleje", "items": ["check_refill_water", "check_behavior_health", "remove_feces"], "auto": False},
    {"age": "12+", "day": "torsdag", "time": "19:30", "category": "fodring", "items": ["snack_legless_insects"], "auto": False},
    {"age": "12+", "day": "torsdag", "time": "20:00", "category": "lys", "items": ["uvb_light", "heat_lamp"], "auto": True},
    {"age": "12+", "day": "fredag", "time": "07:00", "category": "lys", "items": ["uvb_light", "heat_lamp"], "auto": True},
    {"age": "12+", "day": "fredag", "time": "08:30", "category": "fodring", "items": ["leafy_greens", "vegetables", "multivitamin_powder_with_d3"], "auto": False},
    {"age": "12+", "day": "fredag", "time": "16:30", "category": "fodring", "items": ["leafy_greens"], "auto": False},
    {"age": "12+", "day": "fredag", "time": "18:00", "category": "pleje", "items": ["check_refill_water", "check_behavior_health", "remove_feces"], "auto": False},
    {"age": "12+", "day": "fredag", "time": "20:00", "category": "lys", "items": ["uvb_light", "heat_lamp"], "auto": True},
    {"age": "12+", "day": "lørdag", "time": "07:00", "category": "lys", "items": ["uvb_light", "heat_lamp"], "auto": True},
    {"age": "12+", "day": "lørdag", "time": "08:30", "category": "fodring", "items": ["insects_with_legs", "calcium_powder_no_d3"], "auto": False},
    {"age": "12+", "day": "lørdag", "time": "16:30", "category": "fodring", "items": ["leafy_greens"], "auto": False},
    {"age": "12+", "day": "lørdag", "time": "18:00", "category": "pleje", "items": ["check_refill_water", "check_behavior_health"], "auto": False},
    {"age": "12+", "day": "lørdag", "time": "20:00", "category": "lys", "items": ["uvb_light", "heat_lamp"], "auto": True},
    {"age": "12+", "day": "søndag", "time": "07:00", "category": "lys", "items": ["uvb_light", "heat_lamp"], "auto": True},
    {"age": "12+", "day": "søndag", "time": "08:30", "category": "fodring", "items": ["leafy_greens"], "auto": False},
    {"age": "12+", "day": "søndag", "time": "16:30", "category": "fodring", "items": ["leafy_greens"], "auto": False},
    {"age": "12+", "day": "søndag", "time": "18:00", "category": "pleje", "items": ["check_refill_water", "check_behavior_health", "remove_feces", "weekly_cleaning_and_disinfection"], "auto": False},
    {"age": "12+", "day": "søndag", "time": "20:00", "category": "lys", "items": ["uvb_light", "heat_lamp"], "auto": True},
]


def build_slots() -> List[Dict[str, Any]]:
    return _SLOTS


async def apply_default_careplan(db) -> Dict[str, int]:
    """Inserts TIMES/ITEMS/build_slots() into the given (empty) collections.
    Does NOT wipe anything first - caller is responsible for that if needed."""
    from models import TimeSlot, TaskItem, ScheduleSlot

    time_id_map: Dict[str, str] = {}
    for t in TIMES:
        doc = TimeSlot(time=t["time"], winter_time=t.get("winter_time"))
        await db.times.insert_one(doc.to_mongo())
        time_id_map[t["time"]] = doc.id

    item_id_map: Dict[str, str] = {}
    for key, spec in ITEMS.items():
        doc = TaskItem(
            category=spec["category"],
            name=spec["en"],
            name_da=spec["da"],
            name_en=spec["en"],
            is_automatic=spec["auto"],
        )
        await db.task_items.insert_one(doc.to_mongo())
        item_id_map[key] = doc.id

    raw_slots = build_slots()
    slot_docs = []
    for s in raw_slots:
        slot = ScheduleSlot(
            age_category=s["age"],
            day_of_week=s["day"],
            time_id=time_id_map[s["time"]],
            category=s["category"],
            item_ids=[item_id_map[k] for k in s["items"]],
            is_automatic=s["auto"],
        )
        slot_docs.append(slot.to_mongo())
    if slot_docs:
        await db.schedule_slots.insert_many(slot_docs)

    return {
        "times_count": len(time_id_map),
        "items_count": len(item_id_map),
        "schedule_slots_count": len(slot_docs),
    }


async def seed_if_empty(db) -> None:
    """Called once at backend startup. If Times/Task-items/Schedule-slots are
    ALL empty (fresh install / fresh database), auto-loads the default care
    plan captured above."""
    import logging
    logger = logging.getLogger(__name__)
    has_times = await db.times.find_one({})
    has_items = await db.task_items.find_one({})
    has_slots = await db.schedule_slots.find_one({})
    if has_times or has_items or has_slots:
        return
    try:
        counts = await apply_default_careplan(db)
        logger.info(f"First-run auto-seed: loaded default care plan {counts}")
    except Exception as e:
        logger.warning(f"First-run auto-seed failed (app still usable, Admin > Reset can retry): {e}")
