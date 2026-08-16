from fastapi import APIRouter, FastAPI
from starlette.middleware.cors import CORSMiddleware
import logging

from database import db
from routes import (
    dragons,
    task_items,
    times,
    schedule_slots,
    overview,
    admin,
    weights,
    translate,
    auth,
    users,
    invites,
)
from services.bootstrap import bootstrap

app = FastAPI(title="Dragon Keeper API")

api_router = APIRouter(prefix="/api")


@api_router.get("/")
async def root():
    return {"message": "Dragon Keeper API"}


@app.on_event("startup")
async def on_startup():
    """Ensure the built-in superadmin exists and adopt any legacy data."""
    await bootstrap(db)


api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(invites.router)
api_router.include_router(dragons.router)
api_router.include_router(task_items.router)
api_router.include_router(times.router)
api_router.include_router(schedule_slots.router)
api_router.include_router(overview.router)
api_router.include_router(admin.router)
api_router.include_router(weights.router)
api_router.include_router(translate.router)

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
