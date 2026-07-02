from fastapi import APIRouter, FastAPI
from starlette.middleware.cors import CORSMiddleware
import logging

from routes import dragons, task_items, times, schedule_slots, overview, admin, weights

app = FastAPI(title="Bearded Dragon Care API")

api_router = APIRouter(prefix="/api")


@api_router.get("/")
async def root():
    return {"message": "Bearded Dragon Care API"}


api_router.include_router(dragons.router)
api_router.include_router(task_items.router)
api_router.include_router(times.router)
api_router.include_router(schedule_slots.router)
api_router.include_router(overview.router)
api_router.include_router(admin.router)
api_router.include_router(weights.router)

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
