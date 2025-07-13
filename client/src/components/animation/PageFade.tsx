import React, { ElementType, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from 'framer-motion';
import { fadeSlideY, fadeSlideYReduced } from '../../lib/animation/variants';
import { useMountGuard } from '../../hooks/useMountGuard';

interface PageFadeProps {
  children: ReactNode;
  className?: string;
  as?: ElementType;
}

export const PageFade: React.FC<PageFadeProps> = ({ children, className, as }) => {
  const mounted = useMountGuard();
  const shouldReduceMotion = useReducedMotion();
  const MotionTag = as || motion.div;
  const variants = shouldReduceMotion ? fadeSlideYReduced : fadeSlideY;

  if (!mounted) {
    return <div className="opacity-0" aria-hidden="true" />;
  }

  return (
    <MotionTag
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants}
      className={className}
      aria-live="polite"
    >
      {children}
    </MotionTag>
  );
}; 