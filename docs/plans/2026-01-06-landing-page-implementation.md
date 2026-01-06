# Landing Page Hero & CTA Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an engaging landing page with hero section, fanned poster examples, "How It Works" steps, and CTA driving signups.

**Architecture:** Single page component at `apps/web/app/page.tsx` with extracted subcomponents for Hero, PosterShowcase, HowItWorks, and FooterCTA. Static placeholder images served from `public/images/examples/`. All components use shadcn/ui Button and existing design tokens.

**Tech Stack:** Next.js 14, React 18, Tailwind CSS, shadcn/ui, Lucide React icons, Vitest + Testing Library

---

## Task 1: Create Placeholder Poster Images

**Files:**
- Create: `apps/web/public/images/examples/poster-1.svg`
- Create: `apps/web/public/images/examples/poster-2.svg`
- Create: `apps/web/public/images/examples/poster-3.svg`

**Step 1: Create examples directory**

```bash
mkdir -p apps/web/public/images/examples
```

**Step 2: Create poster-1.svg (blue theme)**

```svg
<svg width="600" height="800" viewBox="0 0 600 800" xmlns="http://www.w3.org/2000/svg">
  <rect width="600" height="800" fill="#1a1f3a"/>
  <rect x="20" y="20" width="560" height="760" fill="#252b4a" rx="8"/>
  <text x="300" y="120" text-anchor="middle" fill="#d4af37" font-size="36" font-weight="bold">BJJ OPEN 2026</text>
  <text x="300" y="170" text-anchor="middle" fill="#7a95f3" font-size="18">CHAMPIONSHIP</text>
  <circle cx="300" cy="380" r="150" fill="#2f365a"/>
  <text x="300" y="390" text-anchor="middle" fill="#4361ee" font-size="72">VS</text>
  <text x="300" y="620" text-anchor="middle" fill="#ffffff" font-size="24">March 15, 2026</text>
  <text x="300" y="660" text-anchor="middle" fill="#7a95f3" font-size="16">Los Angeles, CA</text>
  <rect x="200" y="700" width="200" height="50" fill="#4361ee" rx="4"/>
  <text x="300" y="732" text-anchor="middle" fill="#ffffff" font-size="16">REGISTER NOW</text>
</svg>
```

**Step 3: Create poster-2.svg (gold theme)**

```svg
<svg width="600" height="800" viewBox="0 0 600 800" xmlns="http://www.w3.org/2000/svg">
  <rect width="600" height="800" fill="#252b4a"/>
  <rect x="20" y="20" width="560" height="760" fill="#1a1f3a" rx="8"/>
  <rect x="40" y="40" width="520" height="720" stroke="#d4af37" stroke-width="2" fill="none" rx="4"/>
  <text x="300" y="100" text-anchor="middle" fill="#ffd700" font-size="28" font-weight="bold">INVITATIONAL</text>
  <text x="300" y="140" text-anchor="middle" fill="#d4af37" font-size="42" font-weight="bold">SUPER FIGHT</text>
  <rect x="100" y="200" width="400" height="300" fill="#2f365a" rx="8"/>
  <text x="300" y="360" text-anchor="middle" fill="#ffffff" font-size="48">ATHLETE</text>
  <text x="300" y="560" text-anchor="middle" fill="#d4af37" font-size="20">BLACK BELT DIVISION</text>
  <text x="300" y="620" text-anchor="middle" fill="#ffffff" font-size="22">April 20, 2026</text>
  <text x="300" y="660" text-anchor="middle" fill="#7a95f3" font-size="16">Miami, FL</text>
  <rect x="180" y="700" width="240" height="50" fill="#d4af37" rx="4"/>
  <text x="300" y="732" text-anchor="middle" fill="#1a1f3a" font-size="16" font-weight="bold">GET TICKETS</text>
</svg>
```

**Step 4: Create poster-3.svg (purple theme)**

```svg
<svg width="600" height="800" viewBox="0 0 600 800" xmlns="http://www.w3.org/2000/svg">
  <rect width="600" height="800" fill="#2f365a"/>
  <rect x="20" y="20" width="560" height="760" fill="#1a1f3a" rx="8"/>
  <text x="300" y="80" text-anchor="middle" fill="#7a95f3" font-size="18">PRESENTS</text>
  <text x="300" y="130" text-anchor="middle" fill="#ffffff" font-size="38" font-weight="bold">GRAPPLING</text>
  <text x="300" y="180" text-anchor="middle" fill="#4361ee" font-size="38" font-weight="bold">MASTERS</text>
  <polygon points="300,220 380,380 220,380" fill="#3a4269"/>
  <circle cx="300" cy="480" r="100" fill="#252b4a" stroke="#4361ee" stroke-width="3"/>
  <text x="300" y="490" text-anchor="middle" fill="#ffffff" font-size="24">PRO</text>
  <text x="300" y="620" text-anchor="middle" fill="#ffffff" font-size="22">May 5, 2026</text>
  <text x="300" y="660" text-anchor="middle" fill="#7a95f3" font-size="16">Austin, TX</text>
  <rect x="150" y="700" width="300" height="50" fill="#5a7bf0" rx="4"/>
  <text x="300" y="732" text-anchor="middle" fill="#ffffff" font-size="16">WATCH LIVE</text>
</svg>
```

**Step 5: Verify files exist**

```bash
ls -la apps/web/public/images/examples/
```

Expected: 3 SVG files listed

**Step 6: Commit**

```bash
git add apps/web/public/images/examples/
git commit -m "feat(web): add placeholder poster SVG images for landing page"
```

---

## Task 2: Create Landing Page Test File

**Files:**
- Create: `apps/web/app/__tests__/page.test.tsx`

**Step 1: Create test directory**

```bash
mkdir -p apps/web/app/__tests__
```

**Step 2: Write failing tests for landing page**

```typescript
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Home from '../page';

describe('Landing Page', () => {
  describe('Hero Section', () => {
    it('renders the main headline', () => {
      render(<Home />);
      expect(
        screen.getByRole('heading', { level: 1, name: /create tournament posters in minutes/i })
      ).toBeInTheDocument();
    });

    it('renders the subheadline', () => {
      render(<Home />);
      expect(screen.getByText(/design professional bjj competition posters/i)).toBeInTheDocument();
    });

    it('renders the primary CTA button linking to signup', () => {
      render(<Home />);
      const ctaButton = screen.getByRole('link', { name: /get started free/i });
      expect(ctaButton).toBeInTheDocument();
      expect(ctaButton).toHaveAttribute('href', '/auth/signup');
    });

    it('renders the free badge', () => {
      render(<Home />);
      expect(screen.getByText(/free to use/i)).toBeInTheDocument();
    });

    it('renders 3 example poster images', () => {
      render(<Home />);
      const posterImages = screen.getAllByRole('img', { name: /example.*poster/i });
      expect(posterImages).toHaveLength(3);
    });
  });

  describe('How It Works Section', () => {
    it('renders the section heading', () => {
      render(<Home />);
      expect(
        screen.getByRole('heading', { level: 2, name: /how it works/i })
      ).toBeInTheDocument();
    });

    it('renders all 3 steps', () => {
      render(<Home />);
      expect(screen.getByText(/upload photo/i)).toBeInTheDocument();
      expect(screen.getByText(/choose template/i)).toBeInTheDocument();
      expect(screen.getByText(/download.*share/i)).toBeInTheDocument();
    });
  });

  describe('Footer CTA Section', () => {
    it('renders the footer CTA heading', () => {
      render(<Home />);
      expect(screen.getByText(/ready to create your first poster/i)).toBeInTheDocument();
    });

    it('renders secondary CTA button linking to signup', () => {
      render(<Home />);
      const ctaButtons = screen.getAllByRole('link', { name: /get started free/i });
      expect(ctaButtons.length).toBeGreaterThanOrEqual(2);
      ctaButtons.forEach((button) => {
        expect(button).toHaveAttribute('href', '/auth/signup');
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      render(<Home />);
      const h1 = screen.getByRole('heading', { level: 1 });
      const h2s = screen.getAllByRole('heading', { level: 2 });
      expect(h1).toBeInTheDocument();
      expect(h2s.length).toBeGreaterThanOrEqual(1);
    });

    it('renders main landmark', () => {
      render(<Home />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('all images have alt text', () => {
      render(<Home />);
      const images = screen.getAllByRole('img');
      images.forEach((img) => {
        expect(img).toHaveAttribute('alt');
        expect(img.getAttribute('alt')).not.toBe('');
      });
    });
  });
});
```

**Step 3: Run tests to verify they fail**

```bash
cd apps/web && pnpm test app/__tests__/page.test.tsx
```

Expected: FAIL - multiple test failures (component doesn't have expected content yet)

**Step 4: Commit failing tests**

```bash
git add apps/web/app/__tests__/page.test.tsx
git commit -m "test(web): add failing tests for landing page hero and CTA"
```

---

## Task 3: Implement Hero Section

**Files:**
- Modify: `apps/web/app/page.tsx`

**Step 1: Update page.tsx with Hero section**

Replace entire file content:

```tsx
import { Camera, Download, Palette } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <main className="min-h-screen bg-primary-900">
      {/* Hero Section */}
      <section className="relative min-h-screen px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid min-h-[80vh] items-center gap-12 lg:grid-cols-2">
            {/* Hero Content */}
            <div className="space-y-8">
              <span className="inline-block rounded-full border border-accent-gold bg-accent-gold/10 px-4 py-1.5 font-body text-sm text-accent-gold">
                Free to use
              </span>

              <h1 className="font-display text-4xl text-white sm:text-5xl lg:text-6xl">
                Create Tournament Posters in Minutes
              </h1>

              <p className="max-w-lg font-body text-lg text-primary-300 lg:text-xl">
                Design professional BJJ competition posters with your photos. No design skills
                needed.
              </p>

              <div className="flex flex-col gap-4 sm:flex-row">
                <Button asChild size="lg" className="text-base">
                  <Link href="/auth/signup">Get Started Free</Link>
                </Button>
              </div>
            </div>

            {/* Poster Showcase */}
            <div className="relative flex h-[500px] items-center justify-center lg:h-[600px]">
              <div className="relative h-full w-full max-w-md">
                {/* Back poster */}
                <div className="absolute left-0 top-1/2 h-[320px] w-[240px] -translate-y-1/2 -rotate-6 transform overflow-hidden rounded-lg shadow-2xl transition-transform duration-300 hover:scale-105 sm:h-[400px] sm:w-[300px]">
                  <Image
                    src="/images/examples/poster-3.svg"
                    alt="Example BJJ tournament poster with purple theme"
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Middle poster */}
                <div className="absolute left-1/2 top-1/2 z-10 h-[320px] w-[240px] -translate-x-1/2 -translate-y-1/2 transform overflow-hidden rounded-lg shadow-2xl transition-transform duration-300 hover:scale-105 sm:h-[400px] sm:w-[300px]">
                  <Image
                    src="/images/examples/poster-1.svg"
                    alt="Example BJJ tournament poster with blue theme"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>

                {/* Front poster */}
                <div className="absolute right-0 top-1/2 z-20 h-[320px] w-[240px] -translate-y-1/2 rotate-6 transform overflow-hidden rounded-lg shadow-2xl transition-transform duration-300 hover:scale-105 sm:h-[400px] sm:w-[300px]">
                  <Image
                    src="/images/examples/poster-2.svg"
                    alt="Example BJJ tournament poster with gold theme"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-primary-800 px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-16 text-center font-display text-3xl text-white sm:text-4xl">
            How It Works
          </h2>

          <div className="grid gap-8 md:grid-cols-3 md:gap-12">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-6">
                <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-accent-gold bg-primary-700">
                  <Camera className="h-10 w-10 text-accent-gold" />
                </div>
                <span className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary-500 font-body text-sm font-bold text-white">
                  1
                </span>
              </div>
              <h3 className="mb-3 font-body text-xl font-semibold text-white">Upload Photo</h3>
              <p className="font-body text-primary-300">
                Add your athlete photo or use one from your gallery
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-6">
                <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-accent-gold bg-primary-700">
                  <Palette className="h-10 w-10 text-accent-gold" />
                </div>
                <span className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary-500 font-body text-sm font-bold text-white">
                  2
                </span>
              </div>
              <h3 className="mb-3 font-body text-xl font-semibold text-white">Choose Template</h3>
              <p className="font-body text-primary-300">
                Pick from professionally designed tournament layouts
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-6">
                <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-accent-gold bg-primary-700">
                  <Download className="h-10 w-10 text-accent-gold" />
                </div>
                <span className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary-500 font-body text-sm font-bold text-white">
                  3
                </span>
              </div>
              <h3 className="mb-3 font-body text-xl font-semibold text-white">
                Download & Share
              </h3>
              <p className="font-body text-primary-300">
                Export high-quality images ready for print or social media
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA Section */}
      <section className="bg-primary-900 px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-8 font-display text-3xl text-white sm:text-4xl">
            Ready to create your first poster?
          </h2>
          <Button asChild size="lg" className="text-base">
            <Link href="/auth/signup">Get Started Free</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
```

**Step 2: Run tests to verify they pass**

```bash
cd apps/web && pnpm test app/__tests__/page.test.tsx
```

Expected: PASS - all tests should now pass

**Step 3: Run lint and type-check**

```bash
cd apps/web && pnpm lint && pnpm type-check
```

Expected: No errors

**Step 4: Commit implementation**

```bash
git add apps/web/app/page.tsx
git commit -m "feat(web): implement landing page hero, How It Works, and footer CTA"
```

---

## Task 4: Add Visual Polish and Responsive Tweaks

**Files:**
- Modify: `apps/web/app/page.tsx`

**Step 1: Add connecting lines between steps (desktop only)**

Add after the "How It Works" h2, before the steps grid:

```tsx
{/* Connecting lines - desktop only */}
<div className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 md:block">
  <div className="flex items-center gap-[200px]">
    <div className="h-0.5 w-24 bg-gradient-to-r from-accent-gold/50 to-accent-gold/20" />
    <div className="h-0.5 w-24 bg-gradient-to-r from-accent-gold/50 to-accent-gold/20" />
  </div>
</div>
```

And add `relative` to the parent container div.

**Step 2: Run tests to verify nothing broke**

```bash
cd apps/web && pnpm test app/__tests__/page.test.tsx
```

Expected: PASS

**Step 3: Run full test suite, lint, and type-check**

```bash
cd apps/web && pnpm test && pnpm lint && pnpm type-check
```

Expected: All pass

**Step 4: Commit polish**

```bash
git add apps/web/app/page.tsx
git commit -m "style(web): add connecting lines between How It Works steps"
```

---

## Task 5: Manual Verification Checklist

**Step 1: Start dev server**

```bash
pnpm dev
```

**Step 2: Verify in browser at http://localhost:3000**

Checklist:
- [ ] Hero headline visible and styled correctly
- [ ] "Free to use" badge renders with gold border
- [ ] 3 poster images display in fanned arrangement
- [ ] "Get Started Free" button links to `/auth/signup`
- [ ] "How It Works" section shows 3 steps with icons
- [ ] Footer CTA section renders
- [ ] Mobile responsive (resize to 375px width)
- [ ] Keyboard navigation works (Tab through interactive elements)

**Step 3: Run Lighthouse audit (if available)**

Target: LCP < 2.5s, Accessibility score > 90

---

## Summary

| Task | Description | Status |
|------|-------------|--------|
| 1 | Create placeholder poster SVGs | Pending |
| 2 | Write failing tests | Pending |
| 3 | Implement landing page | Pending |
| 4 | Add visual polish | Pending |
| 5 | Manual verification | Pending |

**Total commits:** 5
