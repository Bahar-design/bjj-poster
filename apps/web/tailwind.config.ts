import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          900: '#1a1f3a',
          800: '#252b4a',
          700: '#2f365a',
          600: '#3a4269',
          500: '#4361ee',
          400: '#5a7bf0',
          300: '#7a95f3',
        },
        accent: {
          gold: '#d4af37',
          'gold-bright': '#ffd700',
        },
      },
      fontFamily: {
        display: ['var(--font-archivo-black)', 'sans-serif'],
        body: ['var(--font-dm-sans)', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
}

export default config
