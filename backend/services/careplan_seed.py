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


async def apply_default_careplan(db) -> Dict[str, int]:
    """Inserts TIMES/ITEMS/build_slots() into the given (empty) collections.
    Does NOT wipe anything first - caller is responsible for that if needed.
    Used by both the Admin > 'Reset & load care plan' endpoint and the
    first-run auto-seed on a fresh/empty database."""
    # Local imports to avoid a circular import between models.py and this module.
    from models import TimeSlot, TaskItem, ScheduleSlot

    time_id_map: Dict[str, str] = {}
    for t in TIMES:
        doc = TimeSlot(time=t)
        await db.times.insert_one(doc.to_mongo())
        time_id_map[t] = doc.id

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
    plan so new installs start with a ready-to-use plan instead of an empty
    app. Never touches dragons/weight_entries, and never overwrites existing
    data (only runs when everything is empty)."""
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
