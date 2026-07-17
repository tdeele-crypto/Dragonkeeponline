/**
 * Optional "online bonus" auto-translation for custom Feeding/Care/Light&Heat
 * item names. The app is fully offline/local otherwise - this is the one
 * feature that still calls a (stateless, database-free) backend endpoint,
 * and only when reachable. Never throws: on any failure (offline, backend
 * not deployed, timeout, etc.) it silently falls back to using the same
 * text for both languages, exactly like the old backend's translator.py did
 * when the LLM call failed.
 */
const BASE_URL = `${process.env.EXPO_PUBLIC_BACKEND_URL}/api`;
const TRANSLATE_TIMEOUT_MS = 6000;

export interface Translations {
  da: string;
  en: string;
}

export async function translateItemName(text: string, sourceLanguage: 'en' | 'da'): Promise<Translations> {
  const trimmed = (text || '').trim();
  const fallback: Translations = { da: trimmed, en: trimmed };
  if (!trimmed) return fallback;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TRANSLATE_TIMEOUT_MS);
    const res = await fetch(`${BASE_URL}/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: trimmed, source_language: sourceLanguage }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return fallback;
    const data = await res.json();
    return {
      da: (data?.da || trimmed).toString(),
      en: (data?.en || trimmed).toString(),
    };
  } catch {
    // Offline, backend not deployed, timeout, etc. - never break item
    // creation/editing because of this bonus feature.
    return fallback;
  }
}
