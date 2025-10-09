// Block 111 Implementation
import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

interface ThemeAnimatorProps {
  children: React.ReactNode;
}

export const ThemeAnimator: React.FC<ThemeAnimatorProps> = ({ children }) => {
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
        key={location[0] || 'fallback'}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={variants}
        className="min-h-screen w-full transition-colors duration-300 bg-background text-foreground"
        aria-live="polite"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};
// Block 111 Implementation    