import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState } from 'react';

export function useRequireAuth() {
  const { session } = useAuth();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!session) setShowModal(true);
    else setShowModal(false);
  }, [session]);

  return { user: session, showModal, setShowModal };
} 