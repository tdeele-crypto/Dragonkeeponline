/**
 * Drop-in replacement for the old network-based API client. The app used to
 * call a FastAPI + MongoDB backend over HTTP for every read/write; it now
 * runs 100% locally/offline via AsyncStorage (see /app/frontend/localdb).
 * The `api.get/post/put/delete(path, body)` call signature is kept
 * identical on purpose, so every existing screen/component in the app
 * keeps working completely unchanged.
 */
import { localRequest } from '@/localdb/router';

function clone<T>(value: T): T {
  return value === undefined ? value : JSON.parse(JSON.stringify(value));
}

async function request(method: 'GET' | 'POST' | 'PUT' | 'DELETE', path: string, body?: any) {
  try {
    const result = await localRequest(method, path, clone(body));
    return clone(result);
  } catch (e: any) {
    throw new Error(e?.message || 'Der opstod en fejl');
  }
}

export const api = {
  get: (path: string) => request('GET', path),
  post: (path: string, body?: any) => request('POST', path, body ?? {}),
  put: (path: string, body?: any) => request('PUT', path, body ?? {}),
  delete: (path: string) => request('DELETE', path),
};

