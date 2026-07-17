from fastapi import APIRouter, HTTPException, Query
from datetime import date as date_cls, datetime, UTC
from typing import Optional
import calendar as calendar_module
from database import db
from models import CompletionToggle, Completion, compute_age_category
from services.season import is_in_winter_period, apply_winter_times

router = APIRouter(tags=["overview"])

DAY_NAMES = ["mandag", "tirsdag", "onsdag", "torsdag", "fredag", "lørdag", "søndag"]


@router.get("/daily-overview")
async def get_daily_overview(date: str = Query(...)):
    try:
        y, m, d = map(int, date.split("-"))
        weekday_idx = date_cls(y, m, d).weekday()
    except ValueError:
        raise HTTPException(status_code=400, detail="Ugyldigt datoformat, brug YYYY-MM-DD")
    day_of_week = DAY_NAMES[weekday_idx]

    dragons = await db.dragons.find().sort("created_at", 1).to_list(1000)
    times = await db.times.find().to_list(1000)
    times_map = {str(t["_id"]): t["time"] for t in times}
    settings_doc = await db.app_settings.find_one({"key": "app_settings_singleton"})
    language = (settings_doc or {}).get("language", "en")
    name_field = "name_da" if language == "da" else "name_en"
    task_items = await db.task_items.find().to_list(1000)
    items_map = {str(i["_id"]): (i.get(name_field) or i.get("name")) for i in task_items}
    completions = await db.completions.find({"date": date}).to_list(1000)
    completion_map = {(c["dragon_id"], c["schedule_slot_id"]): c["completed"] for c in completions}

    summer_start = (settings_doc or {}).get("light_summer_start", "03-01")
    winter_start = (settings_doc or {}).get("light_winter_start", "09-01")
    in_winter = is_in_winter_period(date_cls(y, m, d), summer_start, winter_start)
    times_winter_map = {str(t["_id"]): t.get("winter_time") for t in times}

    result = []
    for dragon in dragons:
        dragon_id = str(dragon["_id"])
        age_category = compute_age_category(dragon["birthday"])
        activity_state = dragon.get("activity_state", "active")
        slot_query = {
            "age_category": age_category,
            "day_of_week": day_of_week,
        }
        if activity_state == "brumation":
            # Bearded dragons in brumation stop eating - hide all feeding
            # tasks until switched back to "active". Care/Light&Heat tasks
            # (temperature checks, UVB, water, cleaning) still apply.
            slot_query["category"] = {"$ne": "fodring"}
        slots = await db.schedule_slots.find(slot_query).to_list(1000)
        tasks = []
        for slot in slots:
            slot_id = str(slot["_id"])
            time_str = times_map.get(slot["time_id"], "??:??")
            item_names = [items_map.get(iid) for iid in slot.get("item_ids", []) if items_map.get(iid)]
            tasks.append({
                "slot_id": slot_id,
                "time": time_str,
                "time_id": slot["time_id"],
                "category": slot["category"],
                "item_names": item_names,
                "is_automatic": slot.get("is_automatic", False),
                "completed": completion_map.get((dragon_id, slot_id), False),
            })
        tasks.sort(key=lambda t: t["time"])
        if in_winter:
            apply_winter_times(tasks, times_winter_map)
        for t in tasks:
            t.pop("time_id", None)
        result.append({
            "dragon_id": dragon_id,
            "name": dragon["name"],
            "photo_base64": dragon.get("photo_base64"),
            "age_category": age_category,
            "activity_state": activity_state,
            "tasks": tasks,
        })

    return {"date": date, "day_of_week": day_of_week, "is_winter_period": in_winter, "dragons": result}


@router.get("/completions/calendar-summary")
async def get_calendar_summary(
    year: int = Query(...),
    month: int = Query(..., ge=1, le=12),
    dragon_id: Optional[str] = Query(None),
):
    """Per-day completion status for a whole month, used by the Daily
    Overview's calendar date-picker. If dragon_id is given, status reflects
    only that dragon's tasks - otherwise it's aggregated across all dragons:
    - 'green'  = every manually-registrable task that day is done
    - 'yellow' = some but not all tasks are done
    - 'red'    = no tasks are done yet
    - 'none'   = no manually-registrable tasks were scheduled that day (edge case)
    Automatic (equipment) tasks like UVB/heat lamps are excluded from the
    count - they run on their own and aren't something the user 'registers'.
    """
    days_in_month = calendar_module.monthrange(year, month)[1]

    dragons = await db.dragons.find().to_list(1000)
    if dragon_id:
        dragons = [d for d in dragons if str(d["_id"]) == dragon_id]
    dragon_info = [
        {
            "id": str(d["_id"]),
            "age_category": compute_age_category(d["birthday"]),
            "activity_state": d.get("activity_state", "active"),
        }
        for d in dragons
    ]

    slots_cache: dict = {}

    async def get_slots(day_of_week: str, age_category: str, activity_state: str):
        key = (day_of_week, age_category, activity_state)
        if key not in slots_cache:
            query = {"age_category": age_category, "day_of_week": day_of_week}
            if activity_state == "brumation":
                query["category"] = {"$ne": "fodring"}
            slots_cache[key] = await db.schedule_slots.find(query).to_list(1000)
        return slots_cache[key]

    days_result = []
    for day_num in range(1, days_in_month + 1):
        d_obj = date_cls(year, month, day_num)
        date_str = d_obj.isoformat()
        day_of_week = DAY_NAMES[d_obj.weekday()]

        dragon_slots: dict = {}
        total = 0
        for info in dragon_info:
            slots = await get_slots(day_of_week, info["age_category"], info["activity_state"])
            # Only count manually-registrable tasks - automatic (equipment) tasks
            # like UVB/heat lamps run on their own and aren't something the user
            # 'registers', so they shouldn't affect the red/yellow/green status.
            registrable = [s for s in slots if not s.get("is_automatic")]
            dragon_slots[info["id"]] = registrable
            total += len(registrable)

        if total == 0:
            days_result.append({"date": date_str, "status": "none", "total": 0, "completed": 0})
            continue

        completions = await db.completions.find({"date": date_str}).to_list(1000)
        completion_map = {(c["dragon_id"], c["schedule_slot_id"]): c["completed"] for c in completions}

        completed = 0
        for info in dragon_info:
            for slot in dragon_slots[info["id"]]:
                slot_id = str(slot["_id"])
                if completion_map.get((info["id"], slot_id)):
                    completed += 1

        if completed == 0:
            status = "red"
        elif completed >= total:
            status = "green"
        else:
            status = "yellow"
        days_result.append({"date": date_str, "status": status, "total": total, "completed": completed})

    return {"year": year, "month": month, "days": days_result}


@router.post("/completions/toggle")
async def toggle_completion(payload: CompletionToggle):
    existing = await db.completions.find_one({
        "dragon_id": payload.dragon_id,
        "schedule_slot_id": payload.schedule_slot_id,
        "date": payload.date,
    })
    if existing:
        new_state = not existing["completed"]
        await db.completions.update_one(
            {"_id": existing["_id"]},
            {"$set": {"completed": new_state, "completed_at": datetime.now(UTC)}},
        )
        return {"completed": new_state}
    comp = Completion(
        dragon_id=payload.dragon_id,
        schedule_slot_id=payload.schedule_slot_id,
        date=payload.date,
        completed=True,
    )
    await db.completions.insert_one(comp.to_mongo())
    return {"completed": True}
