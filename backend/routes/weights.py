from fastapi import APIRouter, HTTPException, Depends
from typing import List
from database import db, to_object_id
from models import WeightEntry, WeightEntryCreate
from services.auth import get_workspace_id

router = APIRouter(tags=["weights"])


@router.post("/dragons/{dragon_id}/weights", response_model=WeightEntry, response_model_by_alias=False)
async def create_weight_entry(dragon_id: str, payload: WeightEntryCreate, ws: str = Depends(get_workspace_id)):
    try:
        d_oid = to_object_id(dragon_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Ugyldigt agame-id")
    dragon = await db.dragons.find_one({"_id": d_oid, "workspace_id": ws})
    if not dragon:
        raise HTTPException(status_code=404, detail="Agame ikke fundet")
    entry = WeightEntry(workspace_id=ws, dragon_id=dragon_id, **payload.model_dump())
    await db.weight_entries.insert_one(entry.to_mongo())
    return entry


@router.get("/dragons/{dragon_id}/weights", response_model=List[WeightEntry], response_model_by_alias=False)
async def list_weight_entries(dragon_id: str, ws: str = Depends(get_workspace_id)):
    docs = await db.weight_entries.find({"dragon_id": dragon_id, "workspace_id": ws}).sort("date", 1).to_list(2000)
    return [WeightEntry.from_mongo(d) for d in docs]


@router.delete("/weights/{entry_id}")
async def delete_weight_entry(entry_id: str, ws: str = Depends(get_workspace_id)):
    try:
        oid = to_object_id(entry_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Ugyldigt id")
    result = await db.weight_entries.delete_one({"_id": oid, "workspace_id": ws})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Vægtmåling ikke fundet")
    return {"success": True}
