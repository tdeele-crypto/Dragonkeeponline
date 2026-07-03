"""Small helper to auto-translate short bearded-dragon care item names
between Danish and English using the Emergent LLM key (Gemini 3 Flash).

Never raises - if the LLM call fails for any reason (no key, network,
rate limit, etc.) it silently falls back to using the original text for
both languages so item creation/updates never break because of this.
"""
import os
import logging

logger = logging.getLogger(__name__)

EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY")

LANG_NAMES = {"da": "Danish", "en": "English"}


async def translate_item_name(text: str, source_lang: str) -> dict:
    text = (text or "").strip()
    result = {"da": text, "en": text}
    if not text or not EMERGENT_LLM_KEY or source_lang not in LANG_NAMES:
        return result

    target_lang = "en" if source_lang == "da" else "da"

    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage

        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"careplan-translate-{abs(hash(text)) % 100000}",
            system_message=(
                "You translate short pet-care terms (feeder insects, vegetables, "
                "supplements, care tasks, lighting/heating equipment) for a bearded "
                "dragon (reptile) care app. Reply with ONLY the translated term - "
                "no punctuation, no explanation, no quotes, no extra words."
            ),
        ).with_model("gemini", "gemini-3-flash-preview")

        prompt = (
            f'Translate this {LANG_NAMES[source_lang]} bearded dragon care term into '
            f'{LANG_NAMES[target_lang]}: "{text}"'
        )
        response = await chat.send_message(UserMessage(text=prompt))
        translated = (response or "").strip().strip('"').strip("'").strip()
        if translated:
            result[target_lang] = translated
    except Exception as e:
        logger.warning(f"Item name translation failed for '{text}': {e}")

    return result
