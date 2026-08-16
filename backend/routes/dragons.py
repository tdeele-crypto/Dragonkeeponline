from fastapi import APIRouter, HTTPException, Depends
from typing import List
from database import db, to_object_id
from models import Dragon, DragonCreate, DragonUpdate, DragonActivityStateUpdate, compute_age_category
from services.auth import get_workspace_id

router = APIRouter(prefix="/dragons", tags=["dragons"])


@router.post("", response_model=Dragon, response_model_by_alias=False)
async def create_dragon(payload: DragonCreate, ws: str = Depends(get_workspace_id)):
    data = payload.model_dump()
    data["age_category"] = compute_age_category(data["birthday"])
    dragon = Dragon(workspace_id=ws, **data)
    await db.dragons.insert_one(dragon.to_mongo())
    return dragon


@router.get("", response_model=List[Dragon], response_model_by_alias=False)
async def list_dragons(ws: str = Depends(get_workspace_id)):
    docs = await db.dragons.find({"workspace_id": ws}).sort("created_at", 1).to_list(1000)
    result = []
    for doc in docs:
        fresh_age = compute_age_category(doc["birthday"])
        if doc.get("age_category") != fresh_age:
            await db.dragons.update_one({"_id": doc["_id"]}, {"$set": {"age_category": fresh_age}})
            doc["age_category"] = fresh_age
        result.append(Dragon.from_mongo(doc))
    return result


@router.get("/{dragon_id}", response_model=Dragon, response_model_by_alias=False)
async def get_dragon(dragon_id: str, ws: str = Depends(get_workspace_id)):
    try:
        oid = to_object_id(dragon_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Ugyldigt id")
    doc = await db.dragons.find_one({"_id": oid, "workspace_id": ws})
    if not doc:
        raise HTTPException(status_code=404, detail="Agame ikke fundet")
    fresh_age = compute_age_category(doc["birthday"])
    if doc.get("age_category") != fresh_age:
        await db.dragons.update_one({"_id": oid}, {"$set": {"age_category": fresh_age}})
        doc["age_category"] = fresh_age
    return Dragon.from_mongo(doc)


@router.put("/{dragon_id}", response_model=Dragon, response_model_by_alias=False)
async def update_dragon(dragon_id: str, payload: DragonUpdate, ws: str = Depends(get_workspace_id)):
    try:
        oid = to_object_id(dragon_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Ugyldigt id")
    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="Ingen data at opdatere")
    if "birthday" in update_data:
        update_data["age_category"] = compute_age_category(update_data["birthday"])
    result = await db.dragons.update_one({"_id": oid, "workspace_id": ws}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Agame ikke fundet")
    doc = await db.dragons.find_one({"_id": oid})
    return Dragon.from_mongo(doc)


@router.delete("/{dragon_id}")
async def delete_dragon(dragon_id: str, ws: str = Depends(get_workspace_id)):
    try:
        oid = to_object_id(dragon_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Ugyldigt id")
    result = await db.dragons.delete_one({"_id": oid, "workspace_id": ws})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Agame ikke fundet")
    await db.completions.delete_many({"dragon_id": dragon_id})
    await db.weight_entries.delete_many({"dragon_id": dragon_id})
    return {"success": True}


@router.put("/{dragon_id}/activity-state", response_model=Dragon, response_model_by_alias=False)
async def update_dragon_activity_state(dragon_id: str, payload: DragonActivityStateUpdate, ws: str = Depends(get_workspace_id)):
    try:
        oid = to_object_id(dragon_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Ugyldigt id")
    result = await db.dragons.update_one({"_id": oid, "workspace_id": ws}, {"$set": {"activity_state": payload.activity_state}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Agame ikke fundet")
    doc = await db.dragons.find_one({"_id": oid})
    return Dragon.from_mongo(doc)
