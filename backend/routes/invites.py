"""Invite people to share your care plan. Since no email service is wired up
yet, inviting generates a short join code (returned to the inviter to share
manually). When the invited person registers with that code they join the
inviter's workspace and share everything (dragons, plan, checkmarks)."""
import secrets
from fastapi import APIRouter, HTTPException, Depends

from database import db, to_object_id
from models import User, Invite, InviteCreate
from services.auth import get_current_user

router = APIRouter(tags=["invites"])


def _gen_code() -> str:
    return secrets.token_urlsafe(6)[:8].upper()


@router.post("/invites")
async def create_invite(payload: InviteCreate, user: User = Depends(get_current_user)):
    email = payload.email.lower().strip()
    # Reuse an existing pending invite for the same email in this workspace.
    existing = await db.invites.find_one(
        {"workspace_id": user.workspace_id, "email": email, "accepted": False}
    )
    if existing:
        return {
            "id": str(existing["_id"]),
            "email": existing["email"],
            "code": existing["code"],
            "accepted": existing.get("accepted", False),
        }
    code = _gen_code()
    while await db.invites.find_one({"code": code}):
        code = _gen_code()
    invite = Invite(
        workspace_id=user.workspace_id,
        email=email,
        code=code,
        created_by=user.id,
    )
    await db.invites.insert_one(invite.to_mongo())
    return {"id": invite.id, "email": invite.email, "code": invite.code, "accepted": False}


@router.get("/invites")
async def list_invites(user: User = Depends(get_current_user)):
    docs = await db.invites.find({"workspace_id": user.workspace_id}).sort("created_at", -1).to_list(500)
    return [
        {
            "id": str(d["_id"]),
            "email": d["email"],
            "code": d["code"],
            "accepted": d.get("accepted", False),
        }
        for d in docs
    ]


@router.delete("/invites/{invite_id}")
async def delete_invite(invite_id: str, user: User = Depends(get_current_user)):
    try:
        oid = to_object_id(invite_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid id")
    result = await db.invites.delete_one({"_id": oid, "workspace_id": user.workspace_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Invite not found")
    return {"success": True}


@router.get("/workspace/members")
async def list_members(user: User = Depends(get_current_user)):
    docs = await db.users.find({"workspace_id": user.workspace_id}).sort("created_at", 1).to_list(500)
    return [
        {
            "id": str(d["_id"]),
            "email": d["email"],
            "display_name": d.get("display_name"),
            "is_active": d.get("is_active", True),
            "is_me": str(d["_id"]) == user.id,
        }
        for d in docs
    ]
