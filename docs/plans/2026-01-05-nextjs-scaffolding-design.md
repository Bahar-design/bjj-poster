# Next.js 14 Project Scaffolding Design

**Issue:** ODE-58 - UI-FND-001
**Date:** 2026-01-05
**Status:** Approved

## Overview

Set up Next.js 14 App Router project in `apps/web/` with TypeScript, Tailwind CSS, and design system tokens.

## Project Structure

```
apps/web/
├── app/
│   ├── layout.tsx        # Root layout with fonts & metadata
│   ├── page.tsx          # Home page
│   └── globals.css       # Tailwind directives & base styles
├── components/           # Shared React components
├── lib/                  # Utilities (cn helper, etc.)
├── public/               # Static assets
├── next.config.ts        # Next.js configuration
├── tailwind.config.ts    # Tailwind with design tokens
├── tsconfig.json         # TypeScript strict config
├── postcss.config.mjs    # PostCSS for Tailwind
├── package.json          # Dependencies
└── .eslintrc.json        # ESLint Next.js config
```

**Decision:** Flat structure (no `src/` directory) - simpler for monorepo context.

## TypeScript Configuration

Strict mode with additional safety checks:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true
  }
}
```

Path alias: `@/*` → `./`

## Tailwind Design Tokens

### Colors

| Token | Value | Usage |
|-------|-------|-------|
| `primary-900` | `#1a1f3a` | Darkest backgrounds |
| `primary-800` | `#252b4a` | Dark backgrounds |
| `primary-700` | `#2f365a` | Secondary backgrounds |
| `primary-600` | `#3a4269` | Borders, muted |
| `primary-500` | `#4361ee` | Main brand color |
| `primary-400` | `#5a7bf0` | Hover states |
| `primary-300` | `#7a95f3` | Light accents |
| `accent-gold` | `#d4af37` | Gold accent |
| `accent-gold-bright` | `#ffd700` | Bright gold highlights |

### Fonts

| Class | Font | Usage |
|-------|------|-------|
| `font-display` | Archivo Black | Headings, titles |
| `font-body` | DM Sans | Paragraphs, UI text |
| `font-mono` | JetBrains Mono | Code, accents |

## Font Loading

Using Next.js font optimization with CSS variables:

```typescript
import { Archivo_Black, DM_Sans, JetBrains_Mono } from 'next/font/google'

const archivoBlack = Archivo_Black({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-archivo-black',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})
```

## ESLint & Prettier

**ESLint:** `next/core-web-vitals` + `next/typescript`

**Prettier:**
```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5"
}
```

## Package Scripts

```json
{
  "dev": "next dev --port 3000",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "lint:fix": "next lint --fix",
  "type-check": "tsc --noEmit"
}
```

## Initialization Approach

Use `pnpm create next-app@14` with flags to get working baseline, then customize:
- `--typescript`
- `--tailwind`
- `--eslint`
- `--app`
- `--no-src-dir`
