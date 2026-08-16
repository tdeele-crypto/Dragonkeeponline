from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, UTC

from database import db, to_object_id
from models import RegisterRequest, LoginRequest, User, Workspace
from services.auth import (
    hash_password,
    verify_password,
    create_access_token,
    user_public,
    get_current_user,
)
from services.careplan_seed import apply_default_careplan

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register")
async def register(payload: RegisterRequest):
    email = payload.email.lower().strip()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email is already registered")

    invite = None
    workspace_id = None
    if payload.invite_code:
        code = payload.invite_code.strip().upper()
        invite = await db.invites.find_one({"code": code})
        if not invite:
            raise HTTPException(status_code=400, detail="Invalid invite code")
        if invite.get("accepted"):
            raise HTTPException(status_code=400, detail="This invite has already been used")
        workspace_id = invite["workspace_id"]

    if workspace_id is None:
        ws = Workspace(name=(payload.display_name or email.split("@")[0]) + "'s plan")
        await db.workspaces.insert_one(ws.to_mongo())
        workspace_id = ws.id

    user = User(
        email=email,
        password_hash=hash_password(payload.password),
        display_name=payload.display_name,
        role="user",
        workspace_id=workspace_id,
        is_active=True,
        last_login=datetime.now(UTC),
    )
    await db.users.insert_one(user.to_mongo())

    if invite is None:
        # Brand new workspace: this user owns it and gets a default care plan.
        await db.workspaces.update_one(
            {"_id": to_object_id(workspace_id)}, {"$set": {"owner_user_id": user.id}}
        )
        try:
            await apply_default_careplan(db, workspace_id)
        except Exception:
            pass
    else:
        await db.invites.update_one(
            {"_id": invite["_id"]},
            {"$set": {"accepted": True, "accepted_by": user.id}},
        )

    token = create_access_token(user.id)
    return {"access_token": token, "user": user_public(user)}


@router.post("/login")
async def login(payload: LoginRequest):
    email = payload.email.lower().strip()
    doc = await db.users.find_one({"email": email})
    if not doc or not verify_password(payload.password, doc.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    user = User.from_mongo(doc)
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Your account has been deactivated. Contact the administrator.")
    await db.users.update_one({"_id": doc["_id"]}, {"$set": {"last_login": datetime.now(UTC)}})
    token = create_access_token(user.id)
    return {"access_token": token, "user": user_public(user)}


@router.get("/me")
async def me(user: User = Depends(get_current_user)):
    return {"user": user_public(user)}
