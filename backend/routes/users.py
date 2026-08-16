"""Superadmin-only user management: list users, deactivate/reactivate the
inactive/no-longer-active ones, and delete accounts."""
from fastapi import APIRouter, HTTPException, Depends

from database import db, to_object_id
from models import User, UserActiveUpdate
from services.auth import require_superadmin, user_public

router = APIRouter(prefix="/users", tags=["users"])


@router.get("")
async def list_users(admin: User = Depends(require_superadmin)):
    docs = await db.users.find().sort("created_at", 1).to_list(2000)
    workspaces = await db.workspaces.find().to_list(2000)
    ws_name = {str(w["_id"]): w.get("name", "") for w in workspaces}
    result = []
    for d in docs:
        u = User.from_mongo(d)
        pub = user_public(u)
        pub["workspace_name"] = ws_name.get(u.workspace_id, "")
        result.append(pub)
    return result


@router.put("/{user_id}/active")
async def set_user_active(user_id: str, payload: UserActiveUpdate, admin: User = Depends(require_superadmin)):
    try:
        oid = to_object_id(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid id")
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="You cannot change your own active status")
    doc = await db.users.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="User not found")
    if doc.get("role") == "superadmin":
        raise HTTPException(status_code=400, detail="Cannot deactivate a superadmin")
    await db.users.update_one({"_id": oid}, {"$set": {"is_active": payload.is_active}})
    updated = await db.users.find_one({"_id": oid})
    return user_public(User.from_mongo(updated))


@router.delete("/{user_id}")
async def delete_user(user_id: str, admin: User = Depends(require_superadmin)):
    try:
        oid = to_object_id(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid id")
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account")
    doc = await db.users.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="User not found")
    if doc.get("role") == "superadmin":
        raise HTTPException(status_code=400, detail="Cannot delete a superadmin")
    await db.users.delete_one({"_id": oid})
    return {"success": True}
