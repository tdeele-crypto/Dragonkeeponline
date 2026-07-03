from fastapi import APIRouter, HTTPException, Query
from datetime import date as date_cls, datetime, UTC
from database import db
from models import CompletionToggle, Completion, compute_age_category

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

    result = []
    for dragon in dragons:
        dragon_id = str(dragon["_id"])
        age_category = compute_age_category(dragon["birthday"])
        slots = await db.schedule_slots.find({
            "age_category": age_category,
            "day_of_week": day_of_week,
        }).to_list(1000)
        tasks = []
        for slot in slots:
            slot_id = str(slot["_id"])
            time_str = times_map.get(slot["time_id"], "??:??")
            item_names = [items_map.get(iid) for iid in slot.get("item_ids", []) if items_map.get(iid)]
            tasks.append({
                "slot_id": slot_id,
                "time": time_str,
                "category": slot["category"],
                "item_names": item_names,
                "is_automatic": slot.get("is_automatic", False),
                "completed": completion_map.get((dragon_id, slot_id), False),
            })
        tasks.sort(key=lambda t: t["time"])
        result.append({
            "dragon_id": dragon_id,
            "name": dragon["name"],
            "photo_base64": dragon.get("photo_base64"),
            "age_category": age_category,
            "tasks": tasks,
        })

    return {"date": date, "day_of_week": day_of_week, "dragons": result}


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
