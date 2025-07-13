// Block 113 Implementation
export const fadeSlideY = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.32, ease: 'easeOut' } },
  exit: { opacity: 0, y: -16, transition: { duration: 0.22, ease: 'easeIn' } },
};

export const fadeSlideYReduced = {
  initial: { opacity: 1 },
  animate: { opacity: 1 },
  exit: { opacity: 1 },
};
// Block 113 Implementation

// Block 114 Implementation
export const slideX = {
  initial: { x: '100%', opacity: 0 },
  animate: { x: 0, opacity: 1, transition: { duration: 0.32, ease: 'easeOut' } },
  exit: { x: '100%', opacity: 0, transition: { duration: 0.22, ease: 'easeIn' } },
};

export const slideXReduced = {
  initial: { x: 0, opacity: 1 },
  animate: { x: 0, opacity: 1 },
  exit: { x: 0, opacity: 1 },
};
// Block 114 Implementation 