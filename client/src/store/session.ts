import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  jurisdiction: 'NZ' | 'AU' | 'US' | 'GB';
  isPremium: boolean;
}

interface SessionState {
  user: User | null;
  token: string | null;
  setSession: (user: User, token: string) => void;
  clearSession: () => void;
}

export const useSessionStore = create<SessionState>((set: (fn: (state: SessionState) => Partial<SessionState> | SessionState) => void) => ({
  user: null,
  token: null,
  setSession: (user: User, token: string) => set(() => ({ user, token })),
  clearSession: () => set(() => ({ user: null, token: null })),
})); 