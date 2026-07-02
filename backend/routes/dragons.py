from fastapi import APIRouter, HTTPException
from typing import List
from database import db, to_object_id
from models import Dragon, DragonCreate, DragonUpdate

router = APIRouter(prefix="/dragons", tags=["dragons"])

MAX_DRAGONS = 5


@router.post("", response_model=Dragon, response_model_by_alias=False)
async def create_dragon(payload: DragonCreate):
    count = await db.dragons.count_documents({})
    if count >= MAX_DRAGONS:
        raise HTTPException(status_code=400, detail=f"Maksimalt {MAX_DRAGONS} agamer er tilladt")
    dragon = Dragon(**payload.model_dump())
    await db.dragons.insert_one(dragon.to_mongo())
    return dragon


@router.get("", response_model=List[Dragon], response_model_by_alias=False)
async def list_dragons():
    docs = await db.dragons.find().sort("created_at", 1).to_list(1000)
    return [Dragon.from_mongo(d) for d in docs]


@router.get("/{dragon_id}", response_model=Dragon, response_model_by_alias=False)
async def get_dragon(dragon_id: str):
    try:
        oid = to_object_id(dragon_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Ugyldigt id")
    doc = await db.dragons.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Agame ikke fundet")
    return Dragon.from_mongo(doc)


@router.put("/{dragon_id}", response_model=Dragon, response_model_by_alias=False)
async def update_dragon(dragon_id: str, payload: DragonUpdate):
    try:
        oid = to_object_id(dragon_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Ugyldigt id")
    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="Ingen data at opdatere")
    result = await db.dragons.update_one({"_id": oid}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Agame ikke fundet")
    doc = await db.dragons.find_one({"_id": oid})
    return Dragon.from_mongo(doc)


@router.delete("/{dragon_id}")
async def delete_dragon(dragon_id: str):
    try:
        oid = to_object_id(dragon_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Ugyldigt id")
    result = await db.dragons.delete_one({"_id": oid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Agame ikke fundet")
    await db.completions.delete_many({"dragon_id": dragon_id})
    return {"success": True}
