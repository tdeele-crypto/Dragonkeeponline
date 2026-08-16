"""Startup bootstrap for the online multi-user Dragon Keeper.

1. Ensures the built-in superadmin account exists.
2. Adopts any pre-existing (workspace-less) data into the superadmin's
   workspace, so the app's original seeded/created data isn't orphaned once
   multi-tenancy is switched on.
"""
import logging
from datetime import datetime, UTC

from models import User, Workspace
from services.auth import hash_password
from services.careplan_seed import apply_default_careplan

logger = logging.getLogger(__name__)

SUPERADMIN_EMAIL = "thorbjorn74@msn.com"
SUPERADMIN_PASSWORD = "Selma2026!"

DATA_COLLECTIONS = [
    "dragons",
    "task_items",
    "times",
    "schedule_slots",
    "completions",
    "weight_entries",
    "app_settings",
]


async def bootstrap(db) -> None:
    existing = await db.users.find_one({"email": SUPERADMIN_EMAIL})
    if existing:
        superadmin_ws = existing["workspace_id"]
    else:
        ws = Workspace(name="Dragon Keeper (Superadmin)")
        await db.workspaces.insert_one(ws.to_mongo())
        superadmin_ws = ws.id
        user = User(
            email=SUPERADMIN_EMAIL,
            password_hash=hash_password(SUPERADMIN_PASSWORD),
            display_name="Superadmin",
            role="superadmin",
            workspace_id=superadmin_ws,
            is_active=True,
            last_login=None,
        )
        await db.users.insert_one(user.to_mongo())
        await db.workspaces.update_one(
            {"_id": ws.to_mongo()["_id"]}, {"$set": {"owner_user_id": user.id}}
        )
        logger.info("Created built-in superadmin account (%s)", SUPERADMIN_EMAIL)

    # Adopt legacy workspace-less data into the superadmin workspace.
    adopted_any = False
    for coll in DATA_COLLECTIONS:
        result = await db[coll].update_many(
            {"workspace_id": {"$exists": False}},
            {"$set": {"workspace_id": superadmin_ws}},
        )
        # Also fix docs where workspace_id was explicitly null.
        result_null = await db[coll].update_many(
            {"workspace_id": None},
            {"$set": {"workspace_id": superadmin_ws}},
        )
        if (result.modified_count + result_null.modified_count) > 0:
            adopted_any = True
            logger.info(
                "Adopted %d legacy %s docs into superadmin workspace",
                result.modified_count + result_null.modified_count,
                coll,
            )

    # If the superadmin workspace has no care plan at all, seed the default one.
    has_plan = await db.times.find_one({"workspace_id": superadmin_ws})
    if not has_plan and not adopted_any:
        try:
            counts = await apply_default_careplan(db, superadmin_ws)
            logger.info("Seeded default care plan for superadmin: %s", counts)
        except Exception as e:  # noqa: BLE001
            logger.warning("Superadmin default care plan seed failed: %s", e)
