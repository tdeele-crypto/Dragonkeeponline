from fastapi import APIRouter, HTTPException, Body
from datetime import datetime, UTC
from bson import ObjectId
from database import db
from models import AppSettings, AppSettingsUpdate, TimeSlot, TaskItem, ScheduleSlot
from services.careplan_seed import apply_default_careplan

router = APIRouter(prefix="/admin", tags=["admin"])

SETTINGS_KEY = "app_settings_singleton"


@router.get("/settings", response_model=AppSettings, response_model_by_alias=False)
async def get_settings():
    doc = await db.app_settings.find_one({"key": SETTINGS_KEY})
    if not doc:
        return AppSettings()
    return AppSettings.from_mongo(doc)


@router.put("/settings", response_model=AppSettings, response_model_by_alias=False)
async def update_settings(payload: AppSettingsUpdate):
    update_data = payload.model_dump(exclude_unset=True)
    update_data["updated_at"] = datetime.now(UTC)
    await db.app_settings.update_one(
        {"key": SETTINGS_KEY},
        {"$set": update_data, "$setOnInsert": {"key": SETTINGS_KEY}},
        upsert=True,
    )
    doc = await db.app_settings.find_one({"key": SETTINGS_KEY})
    return AppSettings.from_mongo(doc)


def _stringify_ids(docs: list) -> list:
    result = []
    for doc in docs:
        clean = dict(doc)
        clean["_id"] = str(clean["_id"])
        result.append(clean)
    return result


@router.get("/export")
async def export_database():
    dragons = await db.dragons.find().to_list(10000)
    task_items = await db.task_items.find().to_list(10000)
    times = await db.times.find().to_list(10000)
    schedule_slots = await db.schedule_slots.find().to_list(10000)
    completions = await db.completions.find().to_list(10000)
    weight_entries = await db.weight_entries.find().to_list(10000)
    settings_doc = await db.app_settings.find_one({"key": SETTINGS_KEY})

    return {
        "version": 1,
        "exported_at": datetime.now(UTC).isoformat(),
        "dragons": _stringify_ids(dragons),
        "task_items": _stringify_ids(task_items),
        "times": _stringify_ids(times),
        "schedule_slots": _stringify_ids(schedule_slots),
        "completions": _stringify_ids(completions),
        "weight_entries": _stringify_ids(weight_entries),
        "app_settings": _stringify_ids([settings_doc]) if settings_doc else [],
    }


def _restore_object_ids(docs: list) -> list:
    result = []
    for doc in docs:
        clean = dict(doc)
        raw_id = clean.get("_id")
        if raw_id:
            try:
                clean["_id"] = ObjectId(raw_id)
            except Exception:
                clean.pop("_id", None)
        else:
            clean.pop("_id", None)
        result.append(clean)
    return result


@router.post("/import")
async def import_database(payload: dict = Body(...)):
    required_keys = ["dragons", "task_items", "times", "schedule_slots", "completions"]
    for key in required_keys:
        if key not in payload:
            raise HTTPException(status_code=400, detail=f"Ugyldig fil: mangler '{key}'")

    await db.dragons.delete_many({})
    await db.task_items.delete_many({})
    await db.times.delete_many({})
    await db.schedule_slots.delete_many({})
    await db.completions.delete_many({})
    await db.weight_entries.delete_many({})

    if payload["dragons"]:
        await db.dragons.insert_many(_restore_object_ids(payload["dragons"]))
    if payload["task_items"]:
        await db.task_items.insert_many(_restore_object_ids(payload["task_items"]))
    if payload["times"]:
        await db.times.insert_many(_restore_object_ids(payload["times"]))
    if payload["schedule_slots"]:
        await db.schedule_slots.insert_many(_restore_object_ids(payload["schedule_slots"]))
    if payload["completions"]:
        await db.completions.insert_many(_restore_object_ids(payload["completions"]))
    if payload.get("weight_entries"):
        await db.weight_entries.insert_many(_restore_object_ids(payload["weight_entries"]))

    if payload.get("app_settings"):
        await db.app_settings.delete_many({"key": SETTINGS_KEY})
        await db.app_settings.insert_many(_restore_object_ids(payload["app_settings"]))

    return {"success": True}


@router.post("/reset-careplan")
async def reset_careplan():
    """Wipes all Times, Task items (Feeding/Care/Light&Heat) and Schedule slots
    (all age categories) and reloads a complete, editable, bilingual default
    bearded dragon care plan. Dragons and their weight history are NEVER touched."""
    await db.times.delete_many({})
    await db.task_items.delete_many({})
    await db.schedule_slots.delete_many({})
    await db.completions.delete_many({})

    counts = await apply_default_careplan(db)

    return {
        "success": True,
        "times_count": counts["times_count"],
        "items_count": counts["items_count"],
        "schedule_slots_count": counts["schedule_slots_count"],
    }
