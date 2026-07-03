"""
Run this script whenever the user has finished editing Times / Task items
(Feeding, Care, Light&Heat) / Schedule slots in the app to their liking, and
wants THAT exact configuration to become the new permanent default - i.e. the
plan that gets loaded on a fresh install and whenever "Reset & load care plan"
is pressed in Admin.

It reads the CURRENT live database state and regenerates
`backend/services/careplan_seed.py` with an explicit (non-procedural) SLOTS
list capturing exactly what's in the DB right now (item names in both
languages, all weekday/age-category combinations, is_automatic flags, etc).

Usage:
    cd /app/backend && python3 scripts/capture_default_careplan.py

This does NOT modify the live database - it only reads it and rewrites the
Python seed file. After running, restart the backend for `apply_default_careplan`
/ `seed_if_empty` to use the freshly captured plan.
"""
import asyncio
import re
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import db  # noqa: E402

DAYS = ["mandag", "tirsdag", "onsdag", "torsdag", "fredag", "lørdag", "søndag"]
AGE_CATEGORIES = ["2-4", "4-7", "7-12", "12+"]


def slugify(name: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "_", name.lower()).strip("_")
    return slug or "item"


async def capture():
    times_docs = await db.times.find().sort("time", 1).to_list(1000)
    items_docs = await db.task_items.find().to_list(1000)
    slots_docs = await db.schedule_slots.find().to_list(10000)

    if not times_docs or not items_docs or not slots_docs:
        print("ERROR: Times / Task items / Schedule slots are empty in the live "
              "database - nothing to capture. Build out the plan in the app first.")
        return

    time_str_by_id = {str(t["_id"]): t["time"] for t in times_docs}
    times_sorted = sorted({t["time"] for t in times_docs})

    # Build item key map, de-duplicating on (category, name) just in case.
    item_key_by_id = {}
    items_by_key = {}
    used_keys = set()
    for it in items_docs:
        base_key = slugify(it.get("name_en") or it.get("name"))
        key = base_key
        suffix = 2
        while key in used_keys:
            key = f"{base_key}_{suffix}"
            suffix += 1
        used_keys.add(key)
        item_key_by_id[str(it["_id"])] = key
        items_by_key[key] = {
            "category": it["category"],
            "da": it.get("name_da") or it.get("name"),
            "en": it.get("name_en") or it.get("name"),
            "auto": bool(it.get("is_automatic")),
        }

    slots_out = []
    for s in slots_docs:
        time_str = time_str_by_id.get(str(s["time_id"]))
        item_keys = [item_key_by_id.get(str(i)) for i in s.get("item_ids", [])]
        item_keys = [k for k in item_keys if k]
        if not time_str or not item_keys:
            continue
        slots_out.append({
            "age": s["age_category"],
            "day": s["day_of_week"],
            "time": time_str,
            "category": s["category"],
            "items": item_keys,
            "auto": bool(s.get("is_automatic")),
        })

    # Order slots for readability: age -> weekday order -> time
    day_order = {d: i for i, d in enumerate(DAYS)}
    age_order = {a: i for i, a in enumerate(AGE_CATEGORIES)}
    slots_out.sort(key=lambda s: (age_order.get(s["age"], 99), day_order.get(s["day"], 99), s["time"]))

    def py_repr_items() -> str:
        lines = []
        for key, spec in items_by_key.items():
            lines.append(
                f'    "{key}": {{"category": "{spec["category"]}", "da": {spec["da"]!r}, '
                f'"en": {spec["en"]!r}, "auto": {spec["auto"]}}},'
            )
        return "\n".join(lines)

    def py_repr_slots() -> str:
        lines = []
        for s in slots_out:
            items_repr = ", ".join(f'"{k}"' for k in s["items"])
            lines.append(
                f'    {{"age": "{s["age"]}", "day": "{s["day"]}", "time": "{s["time"]}", '
                f'"category": "{s["category"]}", "items": [{items_repr}], "auto": {s["auto"]}}},'
            )
        return "\n".join(lines)

    file_content = f'''"""Built-in default bearded dragon care plan (bilingual da/en) used by the
Admin > 'Reset & load care plan' feature, and auto-seeded on a fresh install.

CAPTURED FROM THE LIVE APP by scripts/capture_default_careplan.py - this is
the user's own customized plan, not a generic template. Editing the app's
Times/Feeding/Care/Light&Heat/Schedules again and re-running that script will
regenerate this file.
"""
from typing import List, Dict, Any

DAYS: List[str] = {DAYS!r}
AGE_CATEGORIES: List[str] = {AGE_CATEGORIES!r}

TIMES: List[str] = {times_sorted!r}

ITEMS: Dict[str, Dict[str, Any]] = {{
{py_repr_items()}
}}

_SLOTS: List[Dict[str, Any]] = [
{py_repr_slots()}
]


def build_slots() -> List[Dict[str, Any]]:
    return _SLOTS


async def apply_default_careplan(db) -> Dict[str, int]:
    """Inserts TIMES/ITEMS/build_slots() into the given (empty) collections.
    Does NOT wipe anything first - caller is responsible for that if needed."""
    from models import TimeSlot, TaskItem, ScheduleSlot

    time_id_map: Dict[str, str] = {{}}
    for t in TIMES:
        doc = TimeSlot(time=t)
        await db.times.insert_one(doc.to_mongo())
        time_id_map[t] = doc.id

    item_id_map: Dict[str, str] = {{}}
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

    return {{
        "times_count": len(time_id_map),
        "items_count": len(item_id_map),
        "schedule_slots_count": len(slot_docs),
    }}


async def seed_if_empty(db) -> None:
    """Called once at backend startup. If Times/Task-items/Schedule-slots are
    ALL empty (fresh install / fresh database), auto-loads the default care
    plan captured above."""
    import logging
    logger = logging.getLogger(__name__)
    has_times = await db.times.find_one({{}})
    has_items = await db.task_items.find_one({{}})
    has_slots = await db.schedule_slots.find_one({{}})
    if has_times or has_items or has_slots:
        return
    try:
        counts = await apply_default_careplan(db)
        logger.info(f"First-run auto-seed: loaded default care plan {{counts}}")
    except Exception as e:
        logger.warning(f"First-run auto-seed failed (app still usable, Admin > Reset can retry): {{e}}")
'''

    target_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "services", "careplan_seed.py")
    with open(target_path, "w", encoding="utf-8") as f:
        f.write(file_content)

    print(f"Captured {len(times_sorted)} times, {len(items_by_key)} items, {len(slots_out)} schedule slots.")
    print(f"Wrote new default care plan to: {target_path}")
    print("Restart the backend for it to take effect on next 'Reset & load care plan' or fresh install.")


if __name__ == "__main__":
    asyncio.run(capture())
