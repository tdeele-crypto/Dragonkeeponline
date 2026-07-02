from typing import List, Optional, Literal
from pydantic import BaseModel, Field
from datetime import datetime, UTC
from database import BaseDocument

AgeCategory = Literal["2-4", "4-7", "7-12", "12+"]
TaskCategory = Literal["fodring", "pleje", "lys"]
DayOfWeek = Literal["mandag", "tirsdag", "onsdag", "torsdag", "fredag", "lørdag", "søndag"]
Gender = Literal["Han", "Hun", "Ukendt"]


class Dragon(BaseDocument):
    name: str
    gender: Gender
    color: str
    morph: str
    birthday: str
    age_category: AgeCategory
    photo_base64: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class DragonCreate(BaseModel):
    name: str
    gender: Gender
    color: str
    morph: str
    birthday: str
    age_category: AgeCategory
    photo_base64: Optional[str] = None


class DragonUpdate(BaseModel):
    name: Optional[str] = None
    gender: Optional[Gender] = None
    color: Optional[str] = None
    morph: Optional[str] = None
    birthday: Optional[str] = None
    age_category: Optional[AgeCategory] = None
    photo_base64: Optional[str] = None


class TaskItem(BaseDocument):
    category: TaskCategory
    name: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class TaskItemCreate(BaseModel):
    category: TaskCategory
    name: str


class TimeSlot(BaseDocument):
    time: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class TimeSlotCreate(BaseModel):
    time: str


class ScheduleSlot(BaseDocument):
    age_category: AgeCategory
    day_of_week: DayOfWeek
    time_id: str
    category: TaskCategory
    item_ids: List[str] = []
    is_automatic: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class ScheduleSlotCreate(BaseModel):
    age_category: AgeCategory
    day_of_week: DayOfWeek
    time_id: str
    category: TaskCategory
    item_ids: List[str] = []
    is_automatic: bool = False


class ScheduleSlotUpdate(BaseModel):
    time_id: Optional[str] = None
    category: Optional[TaskCategory] = None
    item_ids: Optional[List[str]] = None
    is_automatic: Optional[bool] = None


class Completion(BaseDocument):
    dragon_id: str
    schedule_slot_id: str
    date: str
    completed: bool = True
    completed_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class CompletionToggle(BaseModel):
    dragon_id: str
    schedule_slot_id: str
    date: str
