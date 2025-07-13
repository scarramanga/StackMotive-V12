// Block 16 Implementation: useCrisisMode hook
import { useState, useEffect } from 'react';
import { isCrisisMode } from '@/utils/CrisisEngine';

export function useCrisisMode() {
  const [crisis, setCrisis] = useState(false);

  useEffect(() => {
    setCrisis(isCrisisMode());
    // Listen for localStorage changes (for forceCrisisMode toggle)
    const handler = () => setCrisis(isCrisisMode());
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  // Helper to toggle forceCrisisMode
  const toggleForceCrisis = () => {
    const current = localStorage.getItem('forceCrisisMode') === 'true';
    localStorage.setItem('forceCrisisMode', current ? 'false' : 'true');
    setCrisis(isCrisisMode());
  };

  return { crisis, toggleForceCrisis };
} 