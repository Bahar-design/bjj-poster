import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // BJJ-Inspired Color System
        // Deep blacks like a competition gi
        surface: {
          '50': '#fafafa',
          '100': '#f5f5f5',
          '200': '#e5e5e5',
          '300': '#d4d4d4',
          '400': '#a3a3a3',
          '500': '#737373',
          '600': '#525252',
          '700': '#404040',
          '800': '#262626',
          '850': '#1a1a1a',
          '900': '#141414',
          '950': '#0a0a0a',
        },
        // Championship gold - victory, achievement
        gold: {
          '50': '#fefdf8',
          '100': '#fef9e7',
          '200': '#fdf0c3',
          '300': '#fbe38f',
          '400': '#f8d254',
          '500': '#e9c46a',
          '600': '#d4a373',
          '700': '#b8860b',
          '800': '#966f0a',
          '900': '#7a5a0c',
          DEFAULT: '#e9c46a',
        },
        // Mat red - competition, intensity, passion
        mat: {
          '50': '#fef2f2',
          '100': '#fee2e2',
          '200': '#fecaca',
          '300': '#fca5a5',
          '400': '#f87171',
          '500': '#C41E3A', // Primary mat red
          '600': '#A3162D',
          '700': '#7F1122',
          '800': '#5C0C18',
          '900': '#3D080F',
          DEFAULT: '#C41E3A',
        },
        // BJJ Belt colors for accents
        belt: {
          white: '#F5F5F0',
          blue: '#1E3A5F',
          purple: '#4A1259',
          brown: '#5D3A1A',
          black: '#1a1a1a',
          coral: '#FF6B6B', // Coral belt (high degrees)
        },
        // Gi fabric off-white
        gi: {
          white: '#F5F5F0',
          cream: '#FAF8F5',
        },
        // Semantic colors with CSS vars
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          '50': '#faf5f0',
          '100': '#f5ebe0',
          '200': '#e9d5bd',
          '300': '#dbbf9a',
          '400': '#c9a477',
          '500': '#b8935f',
          '600': '#a67d4a',
          '700': '#8a6840',
          '800': '#6e5335',
          '900': '#52402a',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
          gold: '#e9c46a',
          red: '#C41E3A',
        },
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },
      fontFamily: {
        display: ['var(--font-bebas-neue)', 'sans-serif'],
        body: ['var(--font-outfit)', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'monospace'],
        // Adding a Japanese-inspired font option
        accent: ['var(--font-bebas-neue)', 'sans-serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gold-shimmer': 'linear-gradient(110deg, transparent 25%, rgba(233, 196, 106, 0.1) 50%, transparent 75%)',
        'hero-glow': 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(233, 196, 106, 0.15), transparent)',
        // Mat texture gradient
        'mat-texture': 'linear-gradient(135deg, rgba(196, 30, 58, 0.1) 0%, transparent 50%, rgba(196, 30, 58, 0.05) 100%)',
        // Gi weave pattern hint
        'gi-weave': 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.02) 2px, rgba(255,255,255,0.02) 4px)',
        // Dramatic spotlight
        'spotlight': 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(233, 196, 106, 0.2), transparent 70%)',
        // Belt gradient
        'belt-shine': 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(0,0,0,0.2) 100%)',
      },
      boxShadow: {
        'gold-sm': '0 0 10px rgba(233, 196, 106, 0.1)',
        'gold-md': '0 0 20px rgba(233, 196, 106, 0.15)',
        'gold-lg': '0 0 40px rgba(233, 196, 106, 0.2)',
        'gold-glow': '0 0 60px rgba(233, 196, 106, 0.3)',
        'gold-intense': '0 0 80px rgba(233, 196, 106, 0.4), 0 0 120px rgba(233, 196, 106, 0.2)',
        // Mat red shadows
        'mat-glow': '0 0 40px rgba(196, 30, 58, 0.3)',
        'mat-intense': '0 0 60px rgba(196, 30, 58, 0.4)',
        // Dramatic elevation
        'dramatic': '0 25px 80px -20px rgba(0, 0, 0, 0.7), 0 10px 30px -10px rgba(0, 0, 0, 0.5)',
        'inner-highlight': 'inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        'card-hover': '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        // Belt shadow
        'belt': '0 20px 60px -15px rgba(0, 0, 0, 0.5)',
      },
      animation: {
        'fade-in': 'fade-in 0.6s ease-out forwards',
        'fade-in-up': 'fade-in-up 0.6s ease-out forwards',
        'fade-in-down': 'fade-in-down 0.5s ease-out forwards',
        'slide-in-left': 'slide-in-left 0.5s ease-out forwards',
        'slide-in-right': 'slide-in-right 0.5s ease-out forwards',
        'scale-in': 'scale-in 0.4s ease-out forwards',
        'float': 'float 6s ease-in-out infinite',
        'pulse-gold': 'pulse-gold 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
        'bounce-subtle': 'bounce-subtle 2s ease-in-out infinite',
        'text-reveal': 'text-reveal 0.8s ease-out forwards',
        'blur-in': 'blur-in 0.6s ease-out forwards',
        'border-glow': 'border-glow 3s ease-in-out infinite',
        // New dramatic animations
        'belt-wave': 'belt-wave 8s ease-in-out infinite',
        'mat-pulse': 'mat-pulse 4s ease-in-out infinite',
        'champion-glow': 'champion-glow 3s ease-in-out infinite',
        'entrance-dramatic': 'entrance-dramatic 1s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-down': {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-left': {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-gold': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(233, 196, 106, 0.4)' },
          '50%': { boxShadow: '0 0 0 12px rgba(233, 196, 106, 0)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'glow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'bounce-subtle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        'text-reveal': {
          '0%': { opacity: '0', transform: 'translateY(100%)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'blur-in': {
          '0%': { opacity: '0', filter: 'blur(10px)' },
          '100%': { opacity: '1', filter: 'blur(0)' },
        },
        'border-glow': {
          '0%, 100%': { borderColor: 'rgba(233, 196, 106, 0.3)' },
          '50%': { borderColor: 'rgba(233, 196, 106, 0.6)' },
        },
        // New dramatic keyframes
        'belt-wave': {
          '0%, 100%': { transform: 'translateY(0) rotate(-12deg)' },
          '50%': { transform: 'translateY(-20px) rotate(-10deg)' },
        },
        'mat-pulse': {
          '0%, 100%': { opacity: '0.05' },
          '50%': { opacity: '0.1' },
        },
        'champion-glow': {
          '0%, 100%': {
            boxShadow: '0 0 30px rgba(233, 196, 106, 0.3), 0 0 60px rgba(233, 196, 106, 0.1)',
          },
          '50%': {
            boxShadow: '0 0 50px rgba(233, 196, 106, 0.5), 0 0 100px rgba(233, 196, 106, 0.2)',
          },
        },
        'entrance-dramatic': {
          '0%': { opacity: '0', transform: 'translateY(40px) scale(0.95)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.19, 1, 0.22, 1)',
        'in-expo': 'cubic-bezier(0.95, 0.05, 0.795, 0.035)',
        'out-back': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'dramatic': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
