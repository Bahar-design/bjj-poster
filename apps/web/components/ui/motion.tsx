'use client';

import { ReactNode, useRef, useEffect, useState } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useInView,
  AnimatePresence,
  MotionProps,
  useReducedMotion,
} from 'framer-motion';
import {
  fadeUpVariants,
  fadeInVariants,
  scaleInVariants,
  slideLeftVariants,
  slideRightVariants,
  blurRevealVariants,
  rotateInVariants,
  viewportSettings,
  reducedMotionVariants,
  easings,
} from '@/lib/animations';

interface MotionWrapperProps extends MotionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

/**
 * Page transition wrapper - wraps page content for smooth enter/exit animations
 */
export function PageTransition({ children, className }: { children: ReactNode; className?: string }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={prefersReducedMotion ? reducedMotionVariants : {
        initial: { opacity: 0, y: 20, filter: 'blur(8px)' },
        animate: {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          transition: { duration: 0.5, ease: easings.cinematic }
        },
        exit: {
          opacity: 0,
          y: -10,
          filter: 'blur(4px)',
          transition: { duration: 0.3, ease: easings.easeIn }
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Fade up on scroll - reveals content with upward motion
 */
export function FadeUp({ children, className, delay = 0, ...props }: MotionWrapperProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial="initial"
      whileInView="animate"
      viewport={viewportSettings}
      variants={prefersReducedMotion ? reducedMotionVariants : fadeUpVariants}
      transition={{ delay }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * Fade in on scroll - simple opacity reveal
 */
export function FadeIn({ children, className, delay = 0, ...props }: MotionWrapperProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial="initial"
      whileInView="animate"
      viewport={viewportSettings}
      variants={prefersReducedMotion ? reducedMotionVariants : fadeInVariants}
      transition={{ delay }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * Scale in on scroll - grows into view
 */
export function ScaleIn({ children, className, delay = 0, ...props }: MotionWrapperProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial="initial"
      whileInView="animate"
      viewport={viewportSettings}
      variants={prefersReducedMotion ? reducedMotionVariants : scaleInVariants}
      transition={{ delay }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * Slide from left on scroll
 */
export function SlideLeft({ children, className, delay = 0, ...props }: MotionWrapperProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial="initial"
      whileInView="animate"
      viewport={viewportSettings}
      variants={prefersReducedMotion ? reducedMotionVariants : slideLeftVariants}
      transition={{ delay }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * Slide from right on scroll
 */
export function SlideRight({ children, className, delay = 0, ...props }: MotionWrapperProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial="initial"
      whileInView="animate"
      viewport={viewportSettings}
      variants={prefersReducedMotion ? reducedMotionVariants : slideRightVariants}
      transition={{ delay }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * Blur reveal on scroll - dramatic blur-to-clear transition
 */
export function BlurReveal({ children, className, delay = 0, ...props }: MotionWrapperProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial="initial"
      whileInView="animate"
      viewport={viewportSettings}
      variants={prefersReducedMotion ? reducedMotionVariants : blurRevealVariants}
      transition={{ delay }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * Rotate in on scroll - subtle rotation entrance
 */
export function RotateIn({ children, className, delay = 0, ...props }: MotionWrapperProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial="initial"
      whileInView="animate"
      viewport={viewportSettings}
      variants={prefersReducedMotion ? reducedMotionVariants : rotateInVariants}
      transition={{ delay }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * Stagger container - orchestrates staggered child animations
 */
export function StaggerContainer({
  children,
  className,
  staggerDelay = 0.1,
  ...props
}: MotionWrapperProps & { staggerDelay?: number }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial="initial"
      whileInView="animate"
      viewport={viewportSettings}
      variants={prefersReducedMotion ? reducedMotionVariants : {
        initial: {},
        animate: {
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: 0.1,
          },
        },
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * Stagger item - child of StaggerContainer
 */
export function StaggerItem({ children, className, ...props }: MotionWrapperProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      variants={prefersReducedMotion ? reducedMotionVariants : fadeUpVariants}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * Parallax container - creates depth with scroll-based movement
 */
export function Parallax({
  children,
  className,
  speed = 0.5,
  ...props
}: MotionWrapperProps & { speed?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], [100 * speed, -100 * speed]);
  const smoothY = useSpring(y, { stiffness: 100, damping: 30 });

  return (
    <motion.div
      ref={ref}
      style={{ y: smoothY }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * Scroll progress indicator
 */
export function ScrollProgress({ className }: { className?: string }) {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      style={{ scaleX }}
      className={`fixed top-0 left-0 right-0 h-[2px] bg-gold-500 origin-left z-50 ${className || ''}`}
    />
  );
}

/**
 * Magnetic hover effect - element follows cursor
 */
export function MagneticHover({
  children,
  className,
  strength = 0.3,
}: {
  children: ReactNode;
  className?: string;
  strength?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const prefersReducedMotion = useReducedMotion();

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || !ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const x = (e.clientX - centerX) * strength;
    const y = (e.clientY - centerY) * strength;

    setPosition({ x, y });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  const x = useSpring(position.x, { stiffness: 150, damping: 15 });
  const y = useSpring(position.y, { stiffness: 150, damping: 15 });

  return (
    <motion.div
      ref={ref}
      style={{ x, y }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Text reveal animation - characters animate in sequence
 */
export function TextReveal({
  text,
  className,
  delay = 0,
}: {
  text: string;
  className?: string;
  delay?: number;
}) {
  const prefersReducedMotion = useReducedMotion();
  const words = text.split(' ');

  if (prefersReducedMotion) {
    return <span className={className}>{text}</span>;
  }

  return (
    <motion.span
      initial="initial"
      whileInView="animate"
      viewport={viewportSettings}
      className={className}
    >
      {words.map((word, wordIndex) => (
        <span key={wordIndex} className="inline-block mr-[0.25em]">
          {word.split('').map((char, charIndex) => (
            <motion.span
              key={charIndex}
              className="inline-block"
              variants={{
                initial: { opacity: 0, y: 20 },
                animate: {
                  opacity: 1,
                  y: 0,
                  transition: {
                    duration: 0.4,
                    delay: delay + (wordIndex * 0.1) + (charIndex * 0.03),
                    ease: easings.easeOut,
                  },
                },
              }}
            >
              {char}
            </motion.span>
          ))}
        </span>
      ))}
    </motion.span>
  );
}

/**
 * Counter animation - animates number from 0 to target
 */
export function AnimatedCounter({
  target,
  duration = 2,
  className,
}: {
  target: number;
  duration?: number;
  className?: string;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!isInView) return;
    if (prefersReducedMotion) {
      setCount(target);
      return;
    }

    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);

      // Easing function for smooth deceleration
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeOut * target));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isInView, target, duration, prefersReducedMotion]);

  return <span ref={ref} className={className}>{count.toLocaleString()}</span>;
}

/**
 * Glow pulse effect - animated glow on hover
 */
export function GlowPulse({
  children,
  className,
  glowColor = 'rgba(233, 196, 106, 0.4)',
}: {
  children: ReactNode;
  className?: string;
  glowColor?: string;
}) {
  return (
    <motion.div
      className={`relative ${className || ''}`}
      whileHover={{
        boxShadow: [
          `0 0 20px ${glowColor}`,
          `0 0 40px ${glowColor}`,
          `0 0 20px ${glowColor}`,
        ],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        repeatType: 'reverse',
      }}
    >
      {children}
    </motion.div>
  );
}

// Re-export motion primitives for convenience
export { motion, AnimatePresence, useScroll, useTransform, useSpring, useInView };
