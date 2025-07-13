import React from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { useSessionStore } from '../store/session';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const token = useSessionStore((s: any) => s.token);
  const location = useLocation();
  if (!token) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
};

export default AuthGuard; 