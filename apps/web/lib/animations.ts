'use client';

import { Variants, Transition } from 'framer-motion';

/**
 * Shared animation timing curves for consistent motion design
 */
export const easings = {
  // Smooth deceleration - great for entrances
  easeOut: [0.16, 1, 0.3, 1] as const,
  // Smooth acceleration - great for exits
  easeIn: [0.7, 0, 0.84, 0] as const,
  // Natural bounce - playful interactions
  bounce: [0.68, -0.55, 0.265, 1.55] as const,
  // Elastic snap - premium feel
  elastic: [0.175, 0.885, 0.32, 1.275] as const,
  // Cinematic slow-out
  cinematic: [0.22, 1, 0.36, 1] as const,
};

/**
 * Default transition presets
 */
export const transitions = {
  fast: { duration: 0.2, ease: easings.easeOut },
  default: { duration: 0.4, ease: easings.easeOut },
  slow: { duration: 0.6, ease: easings.easeOut },
  spring: { type: 'spring', stiffness: 200, damping: 25 },
  springBouncy: { type: 'spring', stiffness: 300, damping: 20 },
  springGentle: { type: 'spring', stiffness: 100, damping: 15 },
} satisfies Record<string, Transition>;

/**
 * Page transition variants - smooth crossfade with subtle movement
 */
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
    filter: 'blur(8px)',
  },
  animate: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.5,
      ease: easings.cinematic,
      staggerChildren: 0.08,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    filter: 'blur(4px)',
    transition: {
      duration: 0.3,
      ease: easings.easeIn,
    },
  },
};

/**
 * Fade up animation - elements rise into view
 */
export const fadeUpVariants: Variants = {
  initial: {
    opacity: 0,
    y: 40,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: easings.easeOut,
    },
  },
};

/**
 * Fade in animation - simple opacity transition
 */
export const fadeInVariants: Variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: easings.easeOut,
    },
  },
};

/**
 * Scale in animation - elements grow into view
 */
export const scaleInVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.9,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: easings.elastic,
    },
  },
};

/**
 * Slide in from left
 */
export const slideLeftVariants: Variants = {
  initial: {
    opacity: 0,
    x: -60,
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.6,
      ease: easings.easeOut,
    },
  },
};

/**
 * Slide in from right
 */
export const slideRightVariants: Variants = {
  initial: {
    opacity: 0,
    x: 60,
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.6,
      ease: easings.easeOut,
    },
  },
};

/**
 * Stagger container - orchestrates child animations
 */
export const staggerContainerVariants: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

/**
 * Fast stagger for lists and grids
 */
export const staggerFastVariants: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
};

/**
 * Card hover animation
 */
export const cardHoverVariants: Variants = {
  initial: {
    y: 0,
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  },
  hover: {
    y: -8,
    boxShadow: '0 25px 50px -12px rgba(233, 196, 106, 0.15)',
    transition: {
      duration: 0.3,
      ease: easings.easeOut,
    },
  },
};

/**
 * Button tap animation
 */
export const buttonTapVariants: Variants = {
  tap: {
    scale: 0.97,
    transition: {
      duration: 0.1,
    },
  },
};

/**
 * Hero section parallax layer variants
 */
export const parallaxVariants: Variants = {
  initial: { y: 0 },
  animate: { y: 0 },
};

/**
 * Blur reveal animation - content unveils with blur
 */
export const blurRevealVariants: Variants = {
  initial: {
    opacity: 0,
    filter: 'blur(20px)',
    scale: 1.1,
  },
  animate: {
    opacity: 1,
    filter: 'blur(0px)',
    scale: 1,
    transition: {
      duration: 0.8,
      ease: easings.cinematic,
    },
  },
};

/**
 * Rotate in animation - subtle rotation on entry
 */
export const rotateInVariants: Variants = {
  initial: {
    opacity: 0,
    rotate: -5,
    y: 30,
  },
  animate: {
    opacity: 1,
    rotate: 0,
    y: 0,
    transition: {
      duration: 0.6,
      ease: easings.elastic,
    },
  },
};

/**
 * Creates staggered delay for children based on index
 */
export function getStaggerDelay(index: number, baseDelay = 0.1): number {
  return index * baseDelay;
}

/**
 * Creates viewport trigger settings for scroll animations
 */
export const viewportSettings = {
  once: true,
  margin: '-100px',
  amount: 0.3,
} as const;

/**
 * Reduced motion variants - respects user preferences
 */
export const reducedMotionVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.01 } },
  exit: { opacity: 0, transition: { duration: 0.01 } },
};
