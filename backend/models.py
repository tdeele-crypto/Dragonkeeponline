from typing import List, Optional, Literal
from pydantic import BaseModel, Field
from datetime import datetime, UTC, date as date_cls
from database import BaseDocument

AgeCategory = Literal["2-4", "4-7", "7-12", "12+"]
TaskCategory = Literal["fodring", "pleje", "lys"]
DayOfWeek = Literal["mandag", "tirsdag", "onsdag", "torsdag", "fredag", "lørdag", "søndag"]
Gender = Literal["Han", "Hun", "Ukendt"]
AppLanguage = Literal["en", "da"]
WeightUnitPref = Literal["g", "oz"]
TimeFormatPref = Literal["12h", "24h"]


def compute_age_category(birthday: str) -> AgeCategory:
    """Beregner alderskategori automatisk ud fra fødselsdato (YYYY-MM-DD)."""
    try:
        y, m, d = map(int, birthday.split("-"))
        born = date_cls(y, m, d)
    except (ValueError, AttributeError):
        return "2-4"
    today = date_cls.today()
    months = (today.year - born.year) * 12 + (today.month - born.month)
    if today.day < born.day:
        months -= 1
    months = max(months, 0)
    if months < 4:
        return "2-4"
    if months < 7:
        return "4-7"
    if months < 12:
        return "7-12"
    return "12+"


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
    photo_base64: Optional[str] = None


class DragonUpdate(BaseModel):
    name: Optional[str] = None
    gender: Optional[Gender] = None
    color: Optional[str] = None
    morph: Optional[str] = None
    birthday: Optional[str] = None
    photo_base64: Optional[str] = None


class TaskItem(BaseDocument):
    category: TaskCategory
    name: str
    name_da: Optional[str] = None
    name_en: Optional[str] = None
    is_automatic: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class TaskItemCreate(BaseModel):
    category: TaskCategory
    name: str
    is_automatic: bool = False
    source_language: Optional[AppLanguage] = None


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


class ScheduleSlotBulkCopy(BaseModel):
    day_of_weeks: List[DayOfWeek]
    age_categories: List[AgeCategory]
    time_id: str
    category: TaskCategory
    item_ids: List[str] = []
    is_automatic: bool = False


class WeightEntry(BaseDocument):
    dragon_id: str
    weight_grams: float
    note: Optional[str] = None
    date: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class WeightEntryCreate(BaseModel):
    weight_grams: float
    note: Optional[str] = None
    date: str


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


class AppSettings(BaseDocument):
    banner_image_base64: Optional[str] = None
    banner_text: Optional[str] = None
    banner_bg_color: Optional[str] = None
    heading_color: Optional[str] = None
    app_bg_color: Optional[str] = None
    page_title_color: Optional[str] = None
    language: AppLanguage = "en"
    weight_unit: WeightUnitPref = "g"
    time_format: TimeFormatPref = "12h"
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class AppSettingsUpdate(BaseModel):
    banner_image_base64: Optional[str] = None
    banner_text: Optional[str] = None
    banner_bg_color: Optional[str] = None
    heading_color: Optional[str] = None
    app_bg_color: Optional[str] = None
    page_title_color: Optional[str] = None
    language: Optional[AppLanguage] = None
    weight_unit: Optional[WeightUnitPref] = None
    time_format: Optional[TimeFormatPref] = None
