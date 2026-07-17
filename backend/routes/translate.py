"""Stateless translation helper endpoint - does NOT touch MongoDB. Used by
the (now fully local/offline) Expo app as an optional "online bonus": when
the user creates/edits a custom Feeding/Care/Light&Heat item name while
connected to the internet, the app calls this endpoint to auto-translate the
name to the other language via the Emergent LLM key. If unreachable (no
internet, backend not deployed, etc.) the app silently falls back to using
the same text for both languages - see frontend/localdb/translate.ts."""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, Literal
from services.translator import translate_item_name

router = APIRouter(prefix="/translate", tags=["translate"])


class TranslateRequest(BaseModel):
    text: str
    source_language: Optional[Literal["en", "da"]] = "en"


@router.post("")
async def translate(payload: TranslateRequest):
    result = await translate_item_name(payload.text, payload.source_language or "en")
    return result
