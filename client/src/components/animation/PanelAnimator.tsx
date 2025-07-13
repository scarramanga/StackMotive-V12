import React, { useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { slideX, slideXReduced } from '../../lib/animation/variants';
import { useMountGuard } from '../../hooks/useMountGuard';

interface PanelAnimatorProps {
  isVisible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export const PanelAnimator: React.FC<PanelAnimatorProps> = ({ isVisible, onClose, children, className }) => {
  const mounted = useMountGuard();
  const shouldReduceMotion = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);

  // Trap focus and handle Escape key
  useEffect(() => {
    if (!isVisible || !mounted) return;
    const panel = panelRef.current;
    if (!panel) return;
    // Focus the panel
    panel.focus();
    // Trap focus inside panel
    const handleFocus = (e: FocusEvent) => {
      if (panel && !panel.contains(e.target as Node)) {
        e.stopPropagation();
        panel.focus();
      }
    };
    document.addEventListener('focus', handleFocus, true);
    // Handle Escape key
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    // Prevent background scroll
    document.body.classList.add('overflow-hidden');
    return () => {
      document.removeEventListener('focus', handleFocus, true);
      document.removeEventListener('keydown', handleKey);
      document.body.classList.remove('overflow-hidden');
    };
  }, [isVisible, onClose, mounted]);

  if (!mounted) return null;

  return isVisible ? (
    <motion.div
      ref={panelRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={shouldReduceMotion ? slideXReduced : slideX}
      className={`fixed top-0 right-0 h-full w-full max-w-md z-50 bg-card shadow-2xl border-l border-border focus:outline-none ${className || ''}`}
      style={{ outline: 'none' }}
    >
      {children}
    </motion.div>
  ) : null;
}; 