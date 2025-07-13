import { useState, useEffect, useCallback } from 'react';

export function useDiagnosticOverlay() {
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);

  const toggleOverlay = useCallback(() => {
    setIsOverlayOpen((open) => !open);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = (e: KeyboardEvent) => {
      if (e.shiftKey && e.code === 'KeyD') {
        e.preventDefault();
        toggleOverlay();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggleOverlay]);

  return { isOverlayOpen, toggleOverlay };
} 