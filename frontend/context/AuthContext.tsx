import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '@/utils/api';
import { loadToken, setToken as persistToken, clearToken } from '@/utils/authToken';

export interface AuthUser {
  id: string;
  email: string;
  display_name: string | null;
  role: 'superadmin' | 'user';
  workspace_id: string;
  is_active: boolean;
}

interface AuthValue {
  user: AuthUser | null;
  token: string | null;
  initializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName?: string, inviteCode?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    (async () => {
      const stored = await loadToken();
      if (stored) {
        setTokenState(stored);
        try {
          const res = await api.get('/auth/me');
          setUser(res.user);
        } catch {
          await clearToken();
          setTokenState(null);
          setUser(null);
        }
      }
      setInitializing(false);
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    await persistToken(res.access_token);
    setTokenState(res.access_token);
    setUser(res.user);
  }, []);

  const register = useCallback(
    async (email: string, password: string, displayName?: string, inviteCode?: string) => {
      const body: any = { email, password };
      if (displayName) body.display_name = displayName;
      if (inviteCode) body.invite_code = inviteCode;
      const res = await api.post('/auth/register', body);
      await persistToken(res.access_token);
      setTokenState(res.access_token);
      setUser(res.user);
    },
    []
  );

  const logout = useCallback(async () => {
    await clearToken();
    setTokenState(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, initializing, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
