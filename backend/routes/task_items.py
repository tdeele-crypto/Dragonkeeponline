from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from database import db, to_object_id
from models import TaskItem, TaskItemCreate

router = APIRouter(prefix="/task-items", tags=["task-items"])


@router.post("", response_model=TaskItem, response_model_by_alias=False)
async def create_task_item(payload: TaskItemCreate):
    item = TaskItem(**payload.model_dump())
    await db.task_items.insert_one(item.to_mongo())
    return item


@router.get("", response_model=List[TaskItem], response_model_by_alias=False)
async def list_task_items(category: Optional[str] = Query(default=None)):
    query = {"category": category} if category else {}
    docs = await db.task_items.find(query).sort("created_at", 1).to_list(1000)
    return [TaskItem.from_mongo(d) for d in docs]


@router.put("/{item_id}", response_model=TaskItem, response_model_by_alias=False)
async def update_task_item(item_id: str, payload: TaskItemCreate):
    try:
        oid = to_object_id(item_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Ugyldigt id")
    result = await db.task_items.update_one(
        {"_id": oid},
        {"$set": {"name": payload.name, "is_automatic": payload.is_automatic}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Emne ikke fundet")
    doc = await db.task_items.find_one({"_id": oid})
    return TaskItem.from_mongo(doc)


@router.delete("/{item_id}")
async def delete_task_item(item_id: str):
    try:
        oid = to_object_id(item_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Ugyldigt id")
    result = await db.task_items.delete_one({"_id": oid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Emne ikke fundet")
    await db.schedule_slots.update_many({}, {"$pull": {"item_ids": item_id}})
    return {"success": True}
