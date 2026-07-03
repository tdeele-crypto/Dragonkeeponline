"""Built-in default bearded dragon care plan (bilingual da/en) used by the
Admin > 'Reset & load care plan' feature.

Content is based on commonly recommended bearded dragon husbandry guidelines
(feeding frequency/diet ratio by age, UVB/heat photoperiod). This is a
sensible starting point only - users should always adjust to their own vet's
or breeder's guidance, and everything below remains fully editable in the
app after loading (times, items, and weekly schedule slots).
"""
from typing import List, Dict, Any

DAYS: List[str] = ["mandag", "tirsdag", "onsdag", "torsdag", "fredag", "lørdag", "søndag"]
AGE_CATEGORIES: List[str] = ["2-4", "4-7", "7-12", "12+"]

# ---------------------------------------------------------------------------
# Times shared across all age categories
# ---------------------------------------------------------------------------
TIMES: List[str] = ["07:00", "08:00", "09:00", "13:00", "16:00", "18:00", "20:30"]

# ---------------------------------------------------------------------------
# Task items - key -> (category, name_da, name_en, is_automatic)
# ---------------------------------------------------------------------------
ITEMS: Dict[str, Dict[str, Any]] = {
    "insects": {"category": "fodring", "da": "Levende foderinsekter", "en": "Live feeder insects", "auto": False},
    "veg": {"category": "fodring", "da": "Bladgrønt og grøntsager", "en": "Leafy greens & vegetables", "auto": False},
    "fruit": {"category": "fodring", "da": "Frugt (ugentlig godbid)", "en": "Fruit (weekly treat)", "auto": False},
    "calcium": {"category": "fodring", "da": "Kalk-pudder (uden D3)", "en": "Calcium powder (no D3)", "auto": False},
    "multivitamin": {"category": "fodring", "da": "Multivitamin-pudder (med D3)", "en": "Multivitamin powder (with D3)", "auto": False},
    "water": {"category": "pleje", "da": "Tjek og påfyld vand", "en": "Check & refill water", "auto": False},
    "climate": {"category": "pleje", "da": "Tjek temperatur og fugtighed", "en": "Check temperature & humidity", "auto": False},
    "clean": {"category": "pleje", "da": "Rengør terrarium", "en": "Clean terrarium", "auto": False},
    "health": {"category": "pleje", "da": "Tjek adfærd og sundhed", "en": "Check behavior & health", "auto": False},
    "uvb": {"category": "lys", "da": "UVB-lys", "en": "UVB light", "auto": True},
    "heat": {"category": "lys", "da": "Varmelampe", "en": "Heat lamp", "auto": True},
    "night_heat": {"category": "lys", "da": "Keramisk natvarmer (ved behov)", "en": "Ceramic night heater (if needed)", "auto": False},
}

# Which weekdays get a live-insect feeding, per age category (diet mellows with age)
INSECT_DAYS: Dict[str, List[str]] = {
    "2-4": DAYS,  # juvenile: insects every day (+ a 2nd feed at 16:00)
    "4-7": ["mandag", "onsdag", "fredag", "søndag"],  # sub-adult: ~every other day
    "7-12": ["tirsdag", "torsdag", "lørdag"],  # transitioning: ~3x/week
    "12+": ["tirsdag", "lørdag"],  # adult: ~2x/week, mostly veg
}


def build_slots() -> List[Dict[str, Any]]:
    """Returns a flat list of dicts: {age_category, day_of_week, time, category, item_keys, is_automatic}
    Caller resolves `time` -> time_id and `item_keys` -> item_ids before inserting."""
    slots: List[Dict[str, Any]] = []

    for age in AGE_CATEGORIES:
        insect_days = INSECT_DAYS[age]
        for day in DAYS:
            # Lights on/off (automatic)
            slots.append({"age": age, "day": day, "time": "07:00", "category": "lys", "items": ["uvb", "heat"], "auto": True})
            slots.append({"age": age, "day": day, "time": "20:30", "category": "lys", "items": ["uvb", "heat"], "auto": True})

            # Morning veg + supplement (calcium daily, multivitamin on Wednesdays, fruit on Fridays)
            veg_items = ["veg", "calcium"]
            if day == "onsdag":
                veg_items.append("multivitamin")
            if day == "fredag":
                veg_items.append("fruit")
            slots.append({"age": age, "day": day, "time": "09:00", "category": "fodring", "items": veg_items, "auto": False})

            # Insects on age-appropriate days
            if day in insect_days:
                slots.append({"age": age, "day": day, "time": "08:00", "category": "fodring", "items": ["insects"], "auto": False})
            if age == "2-4":
                # Juveniles get a 2nd feed in the afternoon
                slots.append({"age": age, "day": day, "time": "16:00", "category": "fodring", "items": ["insects"], "auto": False})

            # Daily care checks
            slots.append({"age": age, "day": day, "time": "13:00", "category": "pleje", "items": ["climate"], "auto": False})
            evening_care_items = ["water", "health"]
            if day == "søndag":
                # Weekly terrarium cleaning folded into the evening care slot
                evening_care_items.append("clean")
            slots.append({"age": age, "day": day, "time": "18:00", "category": "pleje", "items": evening_care_items, "auto": False})

    return slots
