/**
 * Online API client for Dragon Keeper. Talks to the FastAPI backend over
 * HTTP and attaches the JWT bearer token. The call signature
 * (api.get/post/put/delete(path, body)) is intentionally identical to the
 * old local client, so every existing screen keeps working unchanged.
 */
import { getToken } from '@/utils/authToken';

const BASE_URL = (process.env.EXPO_PUBLIC_BACKEND_URL || '').replace(/\/$/, '');
const API_ROOT = `${BASE_URL}/api`;

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request(method: 'GET' | 'POST' | 'PUT' | 'DELETE', path: string, body?: any) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_ROOT}${path}`, {
      method,
      headers,
      body: body !== undefined && method !== 'GET' ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Network error - check your connection', 0);
  }

  let data: any = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const detail = (data && (data.detail || data.message)) || `Request failed (${res.status})`;
    throw new ApiError(typeof detail === 'string' ? detail : 'Request failed', res.status);
  }
  return data;
}

export const api = {
  get: (path: string) => request('GET', path),
  post: (path: string, body?: any) => request('POST', path, body ?? {}),
  put: (path: string, body?: any) => request('PUT', path, body ?? {}),
  delete: (path: string) => request('DELETE', path),
};
