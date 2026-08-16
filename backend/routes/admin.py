from fastapi import APIRouter, Depends
from datetime import datetime, UTC
from database import db
from models import AppSettings, AppSettingsUpdate
from services.auth import get_workspace_id
from services.careplan_seed import apply_default_careplan

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/settings", response_model=AppSettings, response_model_by_alias=False)
async def get_settings(ws: str = Depends(get_workspace_id)):
    doc = await db.app_settings.find_one({"workspace_id": ws})
    if not doc:
        return AppSettings(workspace_id=ws)
    return AppSettings.from_mongo(doc)


@router.put("/settings", response_model=AppSettings, response_model_by_alias=False)
async def update_settings(payload: AppSettingsUpdate, ws: str = Depends(get_workspace_id)):
    update_data = payload.model_dump(exclude_unset=True)
    update_data["updated_at"] = datetime.now(UTC)
    await db.app_settings.update_one(
        {"workspace_id": ws},
        {"$set": update_data, "$setOnInsert": {"workspace_id": ws}},
        upsert=True,
    )
    doc = await db.app_settings.find_one({"workspace_id": ws})
    return AppSettings.from_mongo(doc)


@router.post("/reset-careplan")
async def reset_careplan(ws: str = Depends(get_workspace_id)):
    """Wipes THIS workspace's Times, Task items and Schedule slots and reloads
    a complete, editable, bilingual default care plan. Dragons and weight
    history are NEVER touched."""
    await db.times.delete_many({"workspace_id": ws})
    await db.task_items.delete_many({"workspace_id": ws})
    await db.schedule_slots.delete_many({"workspace_id": ws})
    await db.completions.delete_many({"workspace_id": ws})

    counts = await apply_default_careplan(db, ws)

    return {
        "success": True,
        "times_count": counts["times_count"],
        "items_count": counts["items_count"],
        "schedule_slots_count": counts["schedule_slots_count"],
    }
