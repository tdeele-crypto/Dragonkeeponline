/**
 * Simple auth-token store. Kept in a module-level variable for synchronous
 * access from the API client, and mirrored to AsyncStorage so the session
 * survives app restarts.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = '@dragonkeeper/token';

let inMemoryToken: string | null = null;

export function getToken(): string | null {
  return inMemoryToken;
}

export async function loadToken(): Promise<string | null> {
  try {
    const t = await AsyncStorage.getItem(TOKEN_KEY);
    inMemoryToken = t;
    return t;
  } catch {
    return null;
  }
}

export async function setToken(token: string): Promise<void> {
  inMemoryToken = token;
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch {
    // ignore persistence errors
  }
}

export async function clearToken(): Promise<void> {
  inMemoryToken = null;
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}
