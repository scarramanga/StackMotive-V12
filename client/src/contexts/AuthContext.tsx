import React, { createContext, useContext } from 'react';
import { useSession, SessionState } from '../hooks/useSession';

const AuthContext = createContext<SessionState | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const session = useSession();
  return <AuthContext.Provider value={session}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
} 