// Block 111 Implementation
import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { useLocation } from 'wouter';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

interface ThemeAnimatorProps {
  children: React.ReactNode;
}

export const ThemeAnimator: React.FC<ThemeAnimatorProps> = ({ children }) => {
  const { resolvedTheme } = useTheme();
  const location = (() => {
    try {
      return useLocation();
    } catch {
      return ['/', () => {}] as ReturnType<typeof useLocation>;
    }
  })();
  const [mounted, setMounted] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  // SSR-safe mount guard to prevent FOUC
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setMounted(true);
    }
  }, []);

  // Responsive layout adaptation via CSS vars
  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.style.setProperty('--app-shell-padding', window.innerWidth < 640 ? '1rem' : '2rem');
    }
  }, []);

  if (!mounted) {
    // Prevent FOUC and SSR mismatch
    return <div className="opacity-0" aria-hidden="true" />;
  }

  // Animation variants
  const variants = shouldReduceMotion
    ? { initial: { opacity: 1 }, animate: { opacity: 1 }, exit: { opacity: 1 } }
    : {
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0, transition: { duration: 0.32, ease: 'easeOut' } },
        exit: { opacity: 0, y: -16, transition: { duration: 0.22, ease: 'easeIn' } },
      };

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={(location[0] || 'fallback') + resolvedTheme}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={variants}
        className="min-h-screen w-full transition-colors duration-300 bg-background text-foreground"
        style={{ padding: 'var(--app-shell-padding, 1rem)' }}
        aria-live="polite"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};
// Block 111 Implementation    