from fastapi import APIRouter, HTTPException
from typing import List
from database import db, to_object_id
from models import TimeSlot, TimeSlotCreate

router = APIRouter(prefix="/times", tags=["times"])


@router.post("", response_model=TimeSlot, response_model_by_alias=False)
async def create_time(payload: TimeSlotCreate):
    existing = await db.times.find_one({"time": payload.time})
    if existing:
        raise HTTPException(status_code=400, detail="Dette tidspunkt findes allerede")
    time_slot = TimeSlot(**payload.model_dump())
    await db.times.insert_one(time_slot.to_mongo())
    return time_slot


@router.get("", response_model=List[TimeSlot], response_model_by_alias=False)
async def list_times():
    docs = await db.times.find().sort("time", 1).to_list(1000)
    return [TimeSlot.from_mongo(d) for d in docs]


@router.delete("/{time_id}")
async def delete_time(time_id: str):
    try:
        oid = to_object_id(time_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Ugyldigt id")
    in_use = await db.schedule_slots.find_one({"time_id": time_id})
    if in_use:
        raise HTTPException(status_code=400, detail="Tidspunktet bruges i en ugeplan og kan ikke slettes")
    result = await db.times.delete_one({"_id": oid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Tidspunkt ikke fundet")
    return {"success": True}
