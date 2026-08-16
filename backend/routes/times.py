from fastapi import APIRouter, HTTPException, Depends
from typing import List
from database import db, to_object_id
from models import TimeSlot, TimeSlotCreate
from services.auth import get_workspace_id

router = APIRouter(prefix="/times", tags=["times"])


@router.post("", response_model=TimeSlot, response_model_by_alias=False)
async def create_time(payload: TimeSlotCreate, ws: str = Depends(get_workspace_id)):
    existing = await db.times.find_one({"time": payload.time, "workspace_id": ws})
    if existing:
        raise HTTPException(status_code=400, detail="Dette tidspunkt findes allerede")
    time_slot = TimeSlot(workspace_id=ws, **payload.model_dump())
    await db.times.insert_one(time_slot.to_mongo())
    return time_slot


@router.get("", response_model=List[TimeSlot], response_model_by_alias=False)
async def list_times(ws: str = Depends(get_workspace_id)):
    docs = await db.times.find({"workspace_id": ws}).sort("time", 1).to_list(1000)
    return [TimeSlot.from_mongo(d) for d in docs]


@router.put("/{time_id}", response_model=TimeSlot, response_model_by_alias=False)
async def update_time(time_id: str, payload: TimeSlotCreate, ws: str = Depends(get_workspace_id)):
    try:
        oid = to_object_id(time_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Ugyldigt id")
    existing = await db.times.find_one({"time": payload.time, "workspace_id": ws, "_id": {"$ne": oid}})
    if existing:
        raise HTTPException(status_code=400, detail="Dette tidspunkt findes allerede")
    result = await db.times.update_one(
        {"_id": oid, "workspace_id": ws}, {"$set": {"time": payload.time, "winter_time": payload.winter_time}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Tidspunkt ikke fundet")
    doc = await db.times.find_one({"_id": oid})
    return TimeSlot.from_mongo(doc)


@router.delete("/{time_id}")
async def delete_time(time_id: str, ws: str = Depends(get_workspace_id)):
    try:
        oid = to_object_id(time_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Ugyldigt id")
    in_use = await db.schedule_slots.find_one({"time_id": time_id, "workspace_id": ws})
    if in_use:
        raise HTTPException(status_code=400, detail="Tidspunktet bruges i en ugeplan og kan ikke slettes")
    result = await db.times.delete_one({"_id": oid, "workspace_id": ws})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Tidspunkt ikke fundet")
    return {"success": True}
