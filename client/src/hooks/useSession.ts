import { useEffect, useState, useCallback } from 'react';
import { getSupabaseClient } from '../lib/initSupabase';
import { getAccessToken, setAccessToken, clearAccessToken } from '../lib/auth';

export type UserRole = 'observer' | 'operator' | 'sovereign';

export interface SessionUser {
  id: string;
  email: string;
  role: UserRole;
  metadata?: Record<string, any>;
}

export interface SessionState {
  user: SessionUser | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}

// Block 44: Session Persistence & Auth
export function useSession(): SessionState {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = getSupabaseClient();

  // Restore session on mount
  useEffect(() => {
    let ignore = false;
    async function restore() {
      setLoading(true);
      try {
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (data.session) {
          setAccessToken(data.session.access_token);
          const { user: supaUser } = data.session;
          // Assume role is in user_metadata.role or app_metadata.role
          const role = (supaUser.user_metadata?.role || supaUser.app_metadata?.role || 'observer') as UserRole;
          const userObj: SessionUser = {
            id: supaUser.id,
            email: supaUser.email,
            role,
            metadata: supaUser.user_metadata,
          };
          if (!ignore) setUser(userObj);
        } else {
          if (!ignore) setUser(null);
        }
        if (!ignore) setError(null);
      } catch (e: any) {
        if (!ignore) setError(e.message || 'Failed to restore session');
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    restore();
    return () => { ignore = true; };
  }, [supabase]);

  // Login
  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
      if (loginError) throw loginError;
      if (data.session) {
        setAccessToken(data.session.access_token);
        const { user: supaUser } = data.session;
        const role = (supaUser.user_metadata?.role || supaUser.app_metadata?.role || 'observer') as UserRole;
        setUser({ id: supaUser.id, email: supaUser.email, role, metadata: supaUser.user_metadata });
      } else {
        setUser(null);
      }
      setError(null);
    } catch (e: any) {
      setError(e.message || 'Login failed');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Logout
  const logout = useCallback(() => {
    supabase.auth.signOut();
    clearAccessToken();
    setUser(null);
  }, [supabase]);

  // Refresh session/token
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) throw refreshError;
      if (data.session) {
        setAccessToken(data.session.access_token);
        const { user: supaUser } = data.session;
        const role = (supaUser.user_metadata?.role || supaUser.app_metadata?.role || 'observer') as UserRole;
        setUser({ id: supaUser.id, email: supaUser.email, role, metadata: supaUser.user_metadata });
      }
      setError(null);
    } catch (e: any) {
      setError(e.message || 'Session refresh failed');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  return { user, loading, error, login, logout, refresh };
} 