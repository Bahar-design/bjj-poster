# BJJ Poster Builder - Web App

Next.js 14 frontend for the BJJ tournament poster generator.

## Setup

From the monorepo root:

```bash
pnpm install
pnpm dev
```

The web app runs at http://localhost:3000

## Development

```bash
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm lint         # Run ESLint
pnpm lint:fix     # Fix ESLint issues
pnpm type-check   # TypeScript check
pnpm format       # Format with Prettier
```

## Design Tokens

### Colors

- `primary-900` to `primary-300`: Indigo/blue scale
- `accent-gold`, `accent-gold-bright`: Gold accents

### Fonts

- `font-display`: Archivo Black (headings)
- `font-body`: DM Sans (body text)
- `font-mono`: JetBrains Mono (code)

## Tech Stack

- Next.js 14 (App Router)
- TypeScript (strict mode)
- Tailwind CSS v3
- ESLint + Prettier
