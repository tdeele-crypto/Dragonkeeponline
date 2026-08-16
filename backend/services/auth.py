"""Email + password auth for the online multi-user Dragon Keeper.
JWT (HS256) bearer tokens + bcrypt password hashing. A `workspace_id` scopes
all of a user's data; invited users share the inviter's workspace."""
import os
from datetime import datetime, timedelta, UTC
from typing import Optional
from pathlib import Path

import bcrypt
import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv

from database import db, to_object_id
from models import User

ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / '.env')

JWT_SECRET = os.environ.get('JWT_SECRET', 'dragonkeeper-dev-secret')
JWT_ALGO = 'HS256'
TOKEN_TTL_DAYS = 30

security = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))
    except Exception:
        return False


def create_access_token(user_id: str) -> str:
    payload = {
        'sub': user_id,
        'iat': datetime.now(UTC),
        'exp': datetime.now(UTC) + timedelta(days=TOKEN_TTL_DAYS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)


def user_public(user: User) -> dict:
    return {
        'id': user.id,
        'email': user.email,
        'display_name': user.display_name,
        'role': user.role,
        'workspace_id': user.workspace_id,
        'is_active': user.is_active,
        'created_at': user.created_at.isoformat() if user.created_at else None,
        'last_login': user.last_login.isoformat() if user.last_login else None,
    }


async def get_current_user(
    creds: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> User:
    if creds is None or not creds.credentials:
        raise HTTPException(status_code=401, detail='Not authenticated')
    try:
        payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALGO])
        user_id = payload.get('sub')
    except Exception:
        raise HTTPException(status_code=401, detail='Invalid or expired token')
    if not user_id:
        raise HTTPException(status_code=401, detail='Invalid token')
    try:
        oid = to_object_id(user_id)
    except ValueError:
        raise HTTPException(status_code=401, detail='Invalid token subject')
    doc = await db.users.find_one({'_id': oid})
    if not doc:
        raise HTTPException(status_code=401, detail='User not found')
    user = User.from_mongo(doc)
    if not user.is_active:
        raise HTTPException(status_code=403, detail='Account is deactivated')
    return user


async def require_superadmin(user: User = Depends(get_current_user)) -> User:
    if user.role != 'superadmin':
        raise HTTPException(status_code=403, detail='Superadmin access required')
    return user


async def get_workspace_id(user: User = Depends(get_current_user)) -> str:
    return user.workspace_id
