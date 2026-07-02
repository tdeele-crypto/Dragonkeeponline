from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from database import db, to_object_id
from models import ScheduleSlot, ScheduleSlotCreate, ScheduleSlotUpdate, ScheduleSlotBulkCopy

router = APIRouter(prefix="/schedule-slots", tags=["schedule-slots"])


@router.post("", response_model=ScheduleSlot, response_model_by_alias=False)
async def create_schedule_slot(payload: ScheduleSlotCreate):
    slot = ScheduleSlot(**payload.model_dump())
    await db.schedule_slots.insert_one(slot.to_mongo())
    return slot


@router.post("/bulk-copy", response_model=List[ScheduleSlot], response_model_by_alias=False)
async def bulk_copy_schedule_slots(payload: ScheduleSlotBulkCopy):
    """Opret/opdater en opgave på tværs af flere ugedage og alderskategorier på én gang.
    Findes der allerede en opgave med samme tidspunkt+kategori for en given
    dag/alderskategori-kombination, bliver den overskrevet i stedet for duplikeret."""
    results = []
    for day in payload.day_of_weeks:
        for age in payload.age_categories:
            existing = await db.schedule_slots.find_one({
                "age_category": age,
                "day_of_week": day,
                "time_id": payload.time_id,
                "category": payload.category,
            })
            if existing:
                await db.schedule_slots.update_one(
                    {"_id": existing["_id"]},
                    {"$set": {"item_ids": payload.item_ids, "is_automatic": payload.is_automatic}},
                )
                doc = await db.schedule_slots.find_one({"_id": existing["_id"]})
                results.append(ScheduleSlot.from_mongo(doc))
            else:
                slot = ScheduleSlot(
                    age_category=age,
                    day_of_week=day,
                    time_id=payload.time_id,
                    category=payload.category,
                    item_ids=payload.item_ids,
                    is_automatic=payload.is_automatic,
                )
                await db.schedule_slots.insert_one(slot.to_mongo())
                results.append(slot)
    return results


@router.get("", response_model=List[ScheduleSlot], response_model_by_alias=False)
async def list_schedule_slots(
    age_category: Optional[str] = Query(default=None),
    day_of_week: Optional[str] = Query(default=None),
):
    query = {}
    if age_category:
        query["age_category"] = age_category
    if day_of_week:
        query["day_of_week"] = day_of_week
    docs = await db.schedule_slots.find(query).to_list(1000)
    return [ScheduleSlot.from_mongo(d) for d in docs]


@router.put("/{slot_id}", response_model=ScheduleSlot, response_model_by_alias=False)
async def update_schedule_slot(slot_id: str, payload: ScheduleSlotUpdate):
    try:
        oid = to_object_id(slot_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Ugyldigt id")
    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="Ingen data at opdatere")
    result = await db.schedule_slots.update_one({"_id": oid}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Task ikke fundet")
    doc = await db.schedule_slots.find_one({"_id": oid})
    return ScheduleSlot.from_mongo(doc)


@router.delete("/{slot_id}")
async def delete_schedule_slot(slot_id: str):
    try:
        oid = to_object_id(slot_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Ugyldigt id")
    result = await db.schedule_slots.delete_one({"_id": oid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task ikke fundet")
    await db.completions.delete_many({"schedule_slot_id": slot_id})
    return {"success": True}
