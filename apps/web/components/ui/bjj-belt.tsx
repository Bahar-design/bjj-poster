'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, useScroll, useTransform, useSpring, useReducedMotion } from 'framer-motion';
import Image from 'next/image';

interface BJJBeltProps {
  className?: string;
  color?: 'white' | 'blue' | 'purple' | 'brown' | 'black' | 'coral' | 'red' | 'gold';
  animated?: boolean;
  stripeCount?: 0 | 1 | 2 | 3 | 4;
}

interface BeltIconProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
}

const beltColors = {
  white: { main: '#F5F3EE', shadow: '#D5D3CE', dark: '#B0AEA8', highlight: '#FFFFFF', stroke: '#8A8A85' },
  blue: { main: '#1E4D7B', shadow: '#153858', dark: '#0E2840', highlight: '#2A6090', stroke: '#0A1825' },
  purple: { main: '#5C2D6B', shadow: '#451F52', dark: '#2E1538', highlight: '#7A3D8A', stroke: '#1A0D1F' },
  brown: { main: '#8B5A2B', shadow: '#6B4420', dark: '#4A3015', highlight: '#A87040', stroke: '#2A1A08' },
  black: { main: '#1a1a1a', shadow: '#0d0d0d', dark: '#000000', highlight: '#333333', stroke: '#000000' },
  coral: { main: '#E8654A', shadow: '#C5503A', dark: '#9A3D2D', highlight: '#F07860', stroke: '#4A1A10' },
  red: { main: '#C41E3A', shadow: '#9A182E', dark: '#701020', highlight: '#E02850', stroke: '#3A0810' },
  gold: { main: '#D4AF37', shadow: '#B8962E', dark: '#9A7B24', highlight: '#E4BF47', stroke: '#5A4510' },
};

/**
 * ============================================================================
 * BJJ BELT HERO - CINEMATIC BELT WITH PROFESSIONAL ANIMATIONS
 * ============================================================================
 *
 * A stunning hero belt component with two distinct animation phases:
 *
 * 1. ENTRANCE ANIMATION (on page load):
 *    - Belt emerges from golden mist with dramatic blur-to-sharp reveal
 *    - Subtle 3D rotation as if being presented on a ceremonial pillow
 *    - Staged reveal: glow → silhouette → full detail
 *
 * 2. SCROLL ANIMATION (user scrolls toward next section):
 *    - Smooth parallax depth shift - belt recedes gracefully
 *    - Perspective tilt creates sense of moving past the belt
 *    - Opacity fade with scale reduction for elegant exit
 */

export function BJJBeltHero({
  className = '',
  animated = true,
}: BJJBeltProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [animationPhase, setAnimationPhase] = useState<'hidden' | 'glow' | 'emerge' | 'reveal' | 'complete'>('hidden');
  const prefersReducedMotion = useReducedMotion();

  // Track scroll progress for the scroll animation
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  // Smooth spring for scroll-based transforms
  const smoothScrollProgress = useSpring(scrollYProgress, {
    stiffness: 80,
    damping: 30,
    restDelta: 0.001,
  });

  // SCROLL ANIMATION TRANSFORMS
  // Parallax Y movement - belt moves up faster than scroll for depth
  const scrollY = useTransform(smoothScrollProgress, [0, 0.5], [0, -120]);

  // Scale reduction as user scrolls - belt recedes into distance
  const scrollScale = useTransform(smoothScrollProgress, [0, 0.6], [1, 0.85]);

  // Perspective tilt - subtle 3D rotation as if looking down at belt
  const scrollRotateX = useTransform(smoothScrollProgress, [0, 0.5], [0, 15]);

  // Opacity fade for elegant exit
  const scrollOpacity = useTransform(smoothScrollProgress, [0.3, 0.7], [1, 0]);

  // Blur increase on scroll for depth-of-field effect
  const scrollBlur = useTransform(smoothScrollProgress, [0.2, 0.6], [0, 8]);

  // ENTRANCE ANIMATION - Staged reveal sequence
  useEffect(() => {
    if (prefersReducedMotion) {
      setAnimationPhase('complete');
      return;
    }

    // Phase 1: Golden glow appears (0-400ms)
    const glowTimer = setTimeout(() => setAnimationPhase('glow'), 100);

    // Phase 2: Belt silhouette emerges through mist (400-900ms)
    const emergeTimer = setTimeout(() => setAnimationPhase('emerge'), 500);

    // Phase 3: Full reveal with detail (900-1600ms)
    const revealTimer = setTimeout(() => setAnimationPhase('reveal'), 1000);

    // Phase 4: Animation complete, ready for scroll interactions
    const completeTimer = setTimeout(() => setAnimationPhase('complete'), 1800);

    return () => {
      clearTimeout(glowTimer);
      clearTimeout(emergeTimer);
      clearTimeout(revealTimer);
      clearTimeout(completeTimer);
    };
  }, [prefersReducedMotion]);

  // Get blur value for scroll animation
  const blurValue = useTransform(scrollBlur, (v) => `blur(${v}px)`);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden ${className}`}
      aria-hidden="true"
      style={{ perspective: '1200px' }}
    >
      {/* === LAYER 1: ATMOSPHERIC GOLDEN MIST === */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{
          opacity: animationPhase !== 'hidden' ? 1 : 0,
        }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Primary radial glow */}
        <motion.div
          className="absolute w-[900px] h-[500px] rounded-full"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(212, 175, 55, 0.15) 0%, rgba(212, 175, 55, 0.05) 40%, transparent 70%)',
          }}
          initial={{ scale: 0.3, opacity: 0 }}
          animate={{
            scale: animationPhase === 'glow' ? 1.2 :
                   animationPhase === 'emerge' ? 1.1 :
                   animationPhase === 'reveal' || animationPhase === 'complete' ? 1 : 0.3,
            opacity: animationPhase !== 'hidden' ? 1 : 0,
          }}
          transition={{
            duration: 1.5,
            ease: [0.16, 1, 0.3, 1],
          }}
        />

        {/* Secondary breathing glow - adds life to the scene */}
        <motion.div
          className="absolute w-[600px] h-[350px] rounded-full"
          style={{
            background: 'radial-gradient(ellipse, rgba(212, 175, 55, 0.12) 0%, transparent 60%)',
            filter: 'blur(50px)',
          }}
          animate={animationPhase === 'complete' ? {
            scale: [1, 1.08, 1],
            opacity: [0.6, 0.8, 0.6],
          } : {}}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </motion.div>

      {/* === LAYER 2: MAIN BELT WITH SCROLL TRANSFORMS === */}
      <motion.div
        className="relative w-full max-w-[950px] aspect-[800/550] flex items-center justify-center"
        style={{
          y: animated ? scrollY : 0,
          scale: animated ? scrollScale : 1,
          rotateX: animated ? scrollRotateX : 0,
          opacity: animated ? scrollOpacity : 1,
          filter: animated ? blurValue : 'none',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Belt entrance container */}
        <motion.div
          className="relative w-full h-full"
          initial={{
            opacity: 0,
            scale: 0.7,
            rotateX: -20,
            rotateY: 8,
            y: 80,
            filter: 'blur(30px) brightness(0.3)',
          }}
          animate={{
            opacity: animationPhase === 'hidden' ? 0 :
                     animationPhase === 'glow' ? 0.3 :
                     animationPhase === 'emerge' ? 0.7 : 1,
            scale: animationPhase === 'hidden' ? 0.7 :
                   animationPhase === 'glow' ? 0.85 :
                   animationPhase === 'emerge' ? 0.95 : 1,
            rotateX: animationPhase === 'hidden' ? -20 :
                     animationPhase === 'glow' ? -12 :
                     animationPhase === 'emerge' ? -5 : 0,
            rotateY: animationPhase === 'hidden' ? 8 :
                     animationPhase === 'glow' ? 4 :
                     animationPhase === 'emerge' ? 1 : 0,
            y: animationPhase === 'hidden' ? 80 :
               animationPhase === 'glow' ? 40 :
               animationPhase === 'emerge' ? 15 : 0,
            filter: animationPhase === 'hidden' ? 'blur(30px) brightness(0.3)' :
                    animationPhase === 'glow' ? 'blur(20px) brightness(0.6)' :
                    animationPhase === 'emerge' ? 'blur(8px) brightness(0.9)' :
                    'blur(0px) brightness(1)',
          }}
          transition={{
            duration: 0.9,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          {/* Dynamic shadow beneath belt */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{
              opacity: animationPhase === 'reveal' || animationPhase === 'complete' ? 0.7 : 0,
            }}
            transition={{ duration: 0.8 }}
          >
            <div
              className="absolute w-[80%] h-[25%] bottom-[8%] rounded-[50%]"
              style={{
                background: 'radial-gradient(ellipse, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 40%, transparent 70%)',
                filter: 'blur(25px)',
                transform: 'translateY(15px)',
              }}
            />
          </motion.div>

          {/* THE BELT IMAGE */}
          <div className="relative w-full h-full flex items-center justify-center">
            <Image
              src="/images/examples/bjj-belt.png"
              alt="BJJ Black Belt"
              fill
              sizes="(max-width: 768px) 100vw, 950px"
              priority
              className="object-contain"
              style={{
                filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.4))',
              }}
            />
          </div>

          {/* Cinematic light sweep on reveal */}
          <motion.div
            className="absolute inset-0 pointer-events-none overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{
              opacity: animationPhase === 'reveal' ? 1 : 0,
            }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(105deg, transparent 0%, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%, transparent 100%)',
              }}
              initial={{ x: '-100%' }}
              animate={animationPhase === 'reveal' ? { x: '200%' } : {}}
              transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
            />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* === LAYER 3: SCROLL HINT === */}
      {animated && (
        <motion.div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{
            opacity: animationPhase === 'complete' ? 0.6 : 0,
            y: animationPhase === 'complete' ? 0 : 10,
          }}
          transition={{ duration: 0.6, delay: 0.3 }}
          style={{
            opacity: useTransform(smoothScrollProgress, [0, 0.15], [0.6, 0]),
          }}
        >
          <span className="text-[10px] uppercase tracking-[0.35em] text-surface-400 font-medium">
            Explore
          </span>
          <motion.div
            className="flex flex-col items-center gap-1"
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="w-[1px] h-4 bg-gradient-to-b from-gold-500/60 to-gold-500/20" />
            <div className="w-1.5 h-1.5 rounded-full bg-gold-500/50" />
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

/**
 * ============================================================================
 * BELT ICON - Beautiful photorealistic belt icon using the PNG asset
 * ============================================================================
 *
 * A polished belt icon component with subtle hover animations and
 * optional continuous micro-motion for visual interest.
 */
const sizeMap = {
  sm: 'h-8 w-8',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
  xl: 'h-24 w-24',
};

export function BeltIcon({ className = '', size = 'md', animated = true }: BeltIconProps) {
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = animated && !prefersReducedMotion;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, rotate: -8 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1],
        rotate: { duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }
      }}
      whileHover={shouldAnimate ? {
        scale: 1.08,
        rotate: 2,
        filter: 'drop-shadow(0 8px 16px rgba(212, 175, 55, 0.3))',
        transition: { duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }
      } : undefined}
      className={`relative ${sizeMap[size]} ${className}`}
    >
      {/* Subtle glow behind icon */}
      <motion.div
        className="absolute inset-0 rounded-full bg-gold-500/20 blur-md"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={shouldAnimate ? {
          opacity: [0.3, 0.5, 0.3],
          scale: [0.8, 1, 0.8],
        } : { opacity: 0.3, scale: 0.8 }}
        transition={shouldAnimate ? {
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        } : undefined}
      />

      {/* The belt icon image */}
      <Image
        src="/images/examples/belt-icon.png"
        alt="BJJ Belt"
        fill
        sizes={size === 'xl' ? '96px' : size === 'lg' ? '64px' : size === 'md' ? '48px' : '32px'}
        className="object-contain drop-shadow-lg"
        style={{
          filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
        }}
      />
    </motion.div>
  );
}

/**
 * Small decorative belt knot icon - matches the realistic belt style
 * @deprecated Use BeltIcon instead for a more polished look
 */
export function BeltKnot({ className, color = 'black' }: BJJBeltProps) {
  const colors = beltColors[color];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      <svg viewBox="0 0 100 75" className="w-full h-full">
        <defs>
          {/* Realistic fabric gradient */}
          <linearGradient id="beltFabricGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={colors.highlight} stopOpacity="0.8" />
            <stop offset="30%" stopColor={colors.main} />
            <stop offset="50%" stopColor={colors.dark} />
            <stop offset="70%" stopColor={colors.main} />
            <stop offset="100%" stopColor={colors.highlight} stopOpacity="0.6" />
          </linearGradient>

          {/* Knot shadow gradient */}
          <radialGradient id="knotShadowGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={colors.dark} />
            <stop offset="100%" stopColor={colors.main} />
          </radialGradient>

          {/* Fabric texture pattern */}
          <pattern id="beltRibTexture" patternUnits="userSpaceOnUse" width="2" height="4">
            <rect width="2" height="4" fill="transparent" />
            <line x1="0" y1="1" x2="2" y2="1" stroke={colors.dark} strokeWidth="0.5" opacity="0.3" />
            <line x1="0" y1="3" x2="2" y2="3" stroke={colors.highlight} strokeWidth="0.3" opacity="0.2" />
          </pattern>

          <filter id="beltKnotShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="2" dy="4" stdDeviation="3" floodColor="#000" floodOpacity="0.4" />
          </filter>
        </defs>

        <g filter="url(#beltKnotShadow)">
          {/* Left horizontal belt section */}
          <path
            d="M 5 28 L 38 25 L 38 35 L 5 38 Q 2 33, 5 28"
            fill="url(#beltFabricGrad)"
            stroke={colors.stroke}
            strokeWidth="0.8"
          />
          <path
            d="M 5 28 L 38 25 L 38 35 L 5 38 Q 2 33, 5 28"
            fill="url(#beltRibTexture)"
            opacity="0.6"
          />

          {/* Right horizontal belt section */}
          <path
            d="M 62 25 L 95 28 Q 98 33, 95 38 L 62 35 Z"
            fill="url(#beltFabricGrad)"
            stroke={colors.stroke}
            strokeWidth="0.8"
          />
          <path
            d="M 62 25 L 95 28 Q 98 33, 95 38 L 62 35 Z"
            fill="url(#beltRibTexture)"
            opacity="0.6"
          />

          {/* Center knot - the twisted wrap */}
          <ellipse
            cx="50"
            cy="30"
            rx="18"
            ry="12"
            fill="url(#knotShadowGrad)"
            stroke={colors.stroke}
            strokeWidth="0.8"
          />
          <ellipse
            cx="50"
            cy="30"
            rx="18"
            ry="12"
            fill="url(#beltRibTexture)"
            opacity="0.5"
          />

          {/* Knot twist detail lines */}
          <path
            d="M 35 28 Q 50 22, 65 28"
            stroke={colors.highlight}
            strokeWidth="1"
            opacity="0.3"
            fill="none"
          />
          <path
            d="M 38 32 Q 50 38, 62 32"
            stroke={colors.dark}
            strokeWidth="1.5"
            opacity="0.4"
            fill="none"
          />

          {/* Left tail hanging down */}
          <path
            d="M 38 35 L 44 35 L 32 68 Q 30 72, 26 70 L 22 68 Q 18 66, 20 62 L 32 35 Z"
            fill="url(#beltFabricGrad)"
            stroke={colors.stroke}
            strokeWidth="0.8"
          />
          <path
            d="M 38 35 L 44 35 L 32 68 Q 30 72, 26 70 L 22 68 Q 18 66, 20 62 L 32 35 Z"
            fill="url(#beltRibTexture)"
            opacity="0.6"
          />

          {/* Right tail hanging down */}
          <path
            d="M 56 35 L 62 35 L 80 62 Q 82 66, 78 68 L 74 70 Q 70 72, 68 68 L 56 35 Z"
            fill="url(#beltFabricGrad)"
            stroke={colors.stroke}
            strokeWidth="0.8"
          />
          <path
            d="M 56 35 L 62 35 L 80 62 Q 82 66, 78 68 L 74 70 Q 70 72, 68 68 L 56 35 Z"
            fill="url(#beltRibTexture)"
            opacity="0.6"
          />

          {/* Stripe bar on left tail - red with white stripes */}
          <g>
            {/* Red stripe bar background */}
            <path
              d="M 26 52 L 34 52 L 28 68 Q 27 71, 24 70 L 21 68 Q 18 66, 19 63 Z"
              fill="#8B1E3F"
              stroke="#5A0F28"
              strokeWidth="0.5"
            />
            {/* Individual white stripes */}
            <rect x="20" y="55" width="12" height="2.5" rx="0.5" fill="#F5F3EE" transform="rotate(-15, 26, 56)" />
            <rect x="20" y="59" width="12" height="2.5" rx="0.5" fill="#F5F3EE" transform="rotate(-15, 26, 60)" />
            <rect x="19" y="63" width="11" height="2.5" rx="0.5" fill="#F5F3EE" transform="rotate(-18, 25, 64)" />
            <rect x="18" y="67" width="10" height="2" rx="0.5" fill="#F5F3EE" transform="rotate(-20, 23, 68)" />
          </g>
        </g>
      </svg>
    </motion.div>
  );
}

/**
 * Belt rank progression indicator
 */
export function BeltRankIndicator({
  currentRank = 'white',
  className,
}: {
  currentRank?: BJJBeltProps['color'];
  className?: string;
}) {
  const ranks: BJJBeltProps['color'][] = ['white', 'blue', 'purple', 'brown', 'black'];
  const currentIndex = ranks.indexOf(currentRank || 'white');

  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      {ranks.map((rank, index) => (
        <motion.div
          key={rank}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: index * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <div
            className={`h-3 rounded-sm transition-all duration-300 ${
              index <= currentIndex ? 'w-10' : 'w-6'
            }`}
            style={{
              backgroundColor: beltColors[rank!].main,
              boxShadow: index <= currentIndex ? `0 2px 8px ${beltColors[rank!].shadow}40` : 'none',
              border: `1px solid ${beltColors[rank!].stroke}`,
            }}
          />
        </motion.div>
      ))}
    </div>
  );
}

/**
 * Decorative belt stripes
 */
export function BeltStripe({ className, stripes = 4 }: { className?: string; stripes?: number }) {
  return (
    <div className={`flex items-center gap-1 ${className || ''}`}>
      {Array.from({ length: stripes }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ delay: i * 0.1, duration: 0.3 }}
          className="h-4 w-1 rounded-sm bg-gold-500"
        />
      ))}
    </div>
  );
}
