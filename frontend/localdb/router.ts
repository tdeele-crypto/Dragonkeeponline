/**
 * Local request router - the on-device replacement for the old REST API.
 * Mimics the exact same `method + path (+ query string) + body` shape the
 * app already used against the FastAPI backend, so `utils/api.ts` can keep
 * the same `api.get/post/put/delete(path, body)` call signature used
 * throughout every screen, with zero changes needed there. Internally this
 * now reads/writes the local AsyncStorage-backed collections instead of
 * making a network call - the app works fully offline.
 */
import * as repos from './repos';
import * as adminOps from './admin';
import { getDailyOverview, getCalendarSummary } from './overview';
import { translateItemName } from './translate';
import { getAll, KEYS } from './storage';
import type { TaskItem } from './types';

function splitPath(path: string): { pathname: string; params: URLSearchParams } {
  const [pathname, queryString] = path.split('?');
  return { pathname, params: new URLSearchParams(queryString || '') };
}

async function resolveTaskItemTranslations(
  name: string,
  sourceLanguage: 'en' | 'da' | undefined,
  existing?: TaskItem | null
): Promise<{ name_da: string; name_en: string }> {
  const nameChanged = !existing || existing.name !== name;
  const missingTranslation = !existing || !existing.name_da || !existing.name_en;
  if (!nameChanged && !missingTranslation && existing) {
    return { name_da: existing.name_da || existing.name, name_en: existing.name_en || existing.name };
  }
  const translations = await translateItemName(name, sourceLanguage || 'en');
  return { name_da: translations.da, name_en: translations.en };
}

export async function localRequest(method: 'GET' | 'POST' | 'PUT' | 'DELETE', path: string, body?: any): Promise<any> {
  const { pathname, params } = splitPath(path);
  const segments = pathname.split('/').filter(Boolean);

  /* ---------------------------- Dragons ---------------------------- */
  if (method === 'GET' && pathname === '/dragons') {
    return repos.listDragons();
  }
  if (method === 'GET' && segments[0] === 'dragons' && segments.length === 2) {
    const dragon = await repos.getDragon(segments[1]);
    if (!dragon) throw new Error('Agame ikke fundet');
    return dragon;
  }
  if (method === 'POST' && pathname === '/dragons') {
    return repos.createDragon(body);
  }
  if (method === 'PUT' && segments[0] === 'dragons' && segments.length === 3 && segments[2] === 'activity-state') {
    const dragon = await repos.updateDragonActivityState(segments[1], body.activity_state);
    if (!dragon) throw new Error('Agame ikke fundet');
    return dragon;
  }
  if (method === 'PUT' && segments[0] === 'dragons' && segments.length === 2) {
    const dragon = await repos.updateDragon(segments[1], body);
    if (!dragon) throw new Error('Agame ikke fundet');
    return dragon;
  }
  if (method === 'DELETE' && segments[0] === 'dragons' && segments.length === 2) {
    const ok = await repos.deleteDragon(segments[1]);
    if (!ok) throw new Error('Agame ikke fundet');
    return { success: true };
  }

  /* ------------------------- Weight entries ------------------------- */
  if (method === 'GET' && segments[0] === 'dragons' && segments.length === 3 && segments[2] === 'weights') {
    return repos.listWeightEntries(segments[1]);
  }
  if (method === 'POST' && segments[0] === 'dragons' && segments.length === 3 && segments[2] === 'weights') {
    return repos.createWeightEntry(segments[1], body);
  }
  if (method === 'DELETE' && segments[0] === 'weights' && segments.length === 2) {
    const ok = await repos.deleteWeightEntry(segments[1]);
    if (!ok) throw new Error('Vægtmåling ikke fundet');
    return { success: true };
  }

  /* ----------------------------- Times ------------------------------ */
  if (method === 'GET' && pathname === '/times') {
    return repos.listTimes();
  }
  if (method === 'POST' && pathname === '/times') {
    return repos.createTime(body);
  }
  if (method === 'PUT' && segments[0] === 'times' && segments.length === 2) {
    return repos.updateTime(segments[1], body);
  }
  if (method === 'DELETE' && segments[0] === 'times' && segments.length === 2) {
    await repos.deleteTime(segments[1]);
    return { success: true };
  }

  /* --------------------------- Task items ---------------------------- */
  if (method === 'GET' && pathname === '/task-items') {
    return repos.listTaskItems(params.get('category'));
  }
  if (method === 'POST' && pathname === '/task-items') {
    const translations = await resolveTaskItemTranslations(body.name, body.source_language, null);
    return repos.createTaskItem({
      category: body.category,
      name: body.name,
      is_automatic: body.is_automatic || false,
      ...translations,
    });
  }
  if (method === 'PUT' && segments[0] === 'task-items' && segments.length === 2) {
    const allItems = await getAll<TaskItem>(KEYS.TASK_ITEMS);
    const existing = allItems.find((i) => i.id === segments[1]) || null;
    const translations = await resolveTaskItemTranslations(body.name, body.source_language, existing);
    return repos.updateTaskItem(segments[1], {
      name: body.name,
      is_automatic: body.is_automatic || false,
      ...translations,
    });
  }
  if (method === 'DELETE' && segments[0] === 'task-items' && segments.length === 2) {
    await repos.deleteTaskItem(segments[1]);
    return { success: true };
  }

  /* ------------------------- Schedule slots -------------------------- */
  if (method === 'GET' && pathname === '/schedule-slots') {
    return repos.listScheduleSlots({
      age_category: params.get('age_category') || undefined,
      day_of_week: params.get('day_of_week') || undefined,
    });
  }
  if (method === 'POST' && pathname === '/schedule-slots/bulk-copy') {
    return repos.bulkCopyScheduleSlots(body);
  }
  if (method === 'POST' && pathname === '/schedule-slots') {
    return repos.createScheduleSlot(body);
  }
  if (method === 'PUT' && segments[0] === 'schedule-slots' && segments.length === 2) {
    return repos.updateScheduleSlot(segments[1], body);
  }
  if (method === 'DELETE' && segments[0] === 'schedule-slots' && segments.length === 2) {
    const allDays = params.get('all_days') === 'true';
    return repos.deleteScheduleSlot(segments[1], allDays);
  }

  /* --------------------------- Overview / completions ---------------------------- */
  if (method === 'GET' && pathname === '/daily-overview') {
    return getDailyOverview(params.get('date') || '');
  }
  if (method === 'POST' && pathname === '/completions/toggle') {
    return repos.toggleCompletion(body);
  }
  if (method === 'GET' && pathname === '/completions/calendar-summary') {
    return getCalendarSummary(parseInt(params.get('year') || '0', 10), parseInt(params.get('month') || '0', 10), params.get('dragon_id'));
  }

  /* ----------------------------- Admin ------------------------------ */
  if (method === 'GET' && pathname === '/admin/settings') {
    return repos.getSettings();
  }
  if (method === 'PUT' && pathname === '/admin/settings') {
    return repos.updateSettings(body);
  }
  if (method === 'GET' && pathname === '/admin/export') {
    return adminOps.exportDatabase();
  }
  if (method === 'POST' && pathname === '/admin/import') {
    await adminOps.importDatabase(body);
    return { success: true };
  }
  if (method === 'POST' && pathname === '/admin/reset-careplan') {
    const counts = await adminOps.resetCareplan();
    return { success: true, ...counts };
  }

  throw new Error(`Ukendt lokal API-rute: ${method} ${path}`);
}
