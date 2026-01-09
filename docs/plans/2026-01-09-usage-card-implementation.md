# UsageCard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a standalone UsageCard component displaying poster quota with progress bar, color-coded thresholds, and upgrade CTA for free users.

**Architecture:** Extract usage display from WelcomeSection into reusable UsageCard component. UsageCard reads from Zustand store, renders tier-appropriate UI. WelcomeSection becomes a composition of welcome header + UsageCard.

**Tech Stack:** React, TypeScript, Zustand, Tailwind CSS, Vitest, React Testing Library

---

## Task 1: Create UsageCard Test File with Progress Bar Tests

**Files:**
- Create: `apps/web/components/dashboard/__tests__/usage-card.test.tsx`

**Step 1: Create test file with progress bar fill tests**

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UsageCard } from '../usage-card';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock the user store
const mockUseUserStore = vi.fn();
vi.mock('@/lib/stores', () => ({
  useUserStore: (selector: (state: unknown) => unknown) => mockUseUserStore(selector),
  UNLIMITED: -1,
}));

describe('UsageCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('progress bar fill', () => {
    it('shows 0% width when no posters used', () => {
      mockUseUserStore.mockImplementation((selector) =>
        selector({
          postersThisMonth: 0,
          postersLimit: 3,
          subscriptionTier: 'free',
        })
      );

      render(<UsageCard />);

      const progressBar = screen.getByTestId('usage-progress');
      expect(progressBar).toHaveStyle({ width: '0%' });
    });

    it('shows 33% width when 1 of 3 posters used', () => {
      mockUseUserStore.mockImplementation((selector) =>
        selector({
          postersThisMonth: 1,
          postersLimit: 3,
          subscriptionTier: 'free',
        })
      );

      render(<UsageCard />);

      const progressBar = screen.getByTestId('usage-progress');
      expect(progressBar).toHaveStyle({ width: '33.33333333333333%' });
    });

    it('shows 100% width when at limit', () => {
      mockUseUserStore.mockImplementation((selector) =>
        selector({
          postersThisMonth: 3,
          postersLimit: 3,
          subscriptionTier: 'free',
        })
      );

      render(<UsageCard />);

      const progressBar = screen.getByTestId('usage-progress');
      expect(progressBar).toHaveStyle({ width: '100%' });
    });

    it('caps at 100% when over limit', () => {
      mockUseUserStore.mockImplementation((selector) =>
        selector({
          postersThisMonth: 5,
          postersLimit: 3,
          subscriptionTier: 'free',
        })
      );

      render(<UsageCard />);

      const progressBar = screen.getByTestId('usage-progress');
      expect(progressBar).toHaveStyle({ width: '100%' });
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd apps/web && pnpm test usage-card.test.tsx`
Expected: FAIL with "Cannot find module '../usage-card'"

---

## Task 2: Create Minimal UsageCard Component

**Files:**
- Create: `apps/web/components/dashboard/usage-card.tsx`

**Step 1: Create minimal component to pass progress bar tests**

```typescript
'use client';

import { useShallow } from 'zustand/react/shallow';
import { useUserStore, UNLIMITED } from '@/lib/stores';
import { cn } from '@/lib/utils';

interface UsageCardProps {
  className?: string;
}

export function UsageCard({ className }: UsageCardProps): JSX.Element {
  const { postersThisMonth, postersLimit } = useUserStore(
    useShallow((state) => ({
      postersThisMonth: state.postersThisMonth,
      postersLimit: state.postersLimit,
    }))
  );

  const isUnlimited = postersLimit === UNLIMITED;
  const percentage = isUnlimited ? 0 : Math.min((postersThisMonth / postersLimit) * 100, 100);

  return (
    <div className={cn('rounded-xl border border-surface-800 bg-surface-900/50 p-6', className)}>
      <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-surface-800">
        <div
          data-testid="usage-progress"
          className="h-full rounded-full bg-emerald-500 transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
```

**Step 2: Run tests to verify they pass**

Run: `cd apps/web && pnpm test usage-card.test.tsx`
Expected: PASS (4 tests)

**Step 3: Commit**

```bash
git add apps/web/components/dashboard/__tests__/usage-card.test.tsx apps/web/components/dashboard/usage-card.tsx
git commit -m "feat(dashboard): add UsageCard with progress bar (ODE-72)"
```

---

## Task 3: Add Color Threshold Tests and Implementation

**Files:**
- Modify: `apps/web/components/dashboard/__tests__/usage-card.test.tsx`
- Modify: `apps/web/components/dashboard/usage-card.tsx`

**Step 1: Add color threshold tests**

Add after the progress bar fill tests:

```typescript
  describe('color thresholds', () => {
    it('shows green (emerald) when under 50%', () => {
      mockUseUserStore.mockImplementation((selector) =>
        selector({
          postersThisMonth: 4,
          postersLimit: 10,
          subscriptionTier: 'pro',
        })
      );

      render(<UsageCard />);

      const progressBar = screen.getByTestId('usage-progress');
      expect(progressBar).toHaveClass('bg-emerald-500');
    });

    it('shows yellow (amber) when at 50%', () => {
      mockUseUserStore.mockImplementation((selector) =>
        selector({
          postersThisMonth: 5,
          postersLimit: 10,
          subscriptionTier: 'pro',
        })
      );

      render(<UsageCard />);

      const progressBar = screen.getByTestId('usage-progress');
      expect(progressBar).toHaveClass('bg-amber-500');
    });

    it('shows yellow (amber) when between 50-80%', () => {
      mockUseUserStore.mockImplementation((selector) =>
        selector({
          postersThisMonth: 7,
          postersLimit: 10,
          subscriptionTier: 'pro',
        })
      );

      render(<UsageCard />);

      const progressBar = screen.getByTestId('usage-progress');
      expect(progressBar).toHaveClass('bg-amber-500');
    });

    it('shows red when at 80%', () => {
      mockUseUserStore.mockImplementation((selector) =>
        selector({
          postersThisMonth: 8,
          postersLimit: 10,
          subscriptionTier: 'pro',
        })
      );

      render(<UsageCard />);

      const progressBar = screen.getByTestId('usage-progress');
      expect(progressBar).toHaveClass('bg-red-500');
    });

    it('shows red when at limit', () => {
      mockUseUserStore.mockImplementation((selector) =>
        selector({
          postersThisMonth: 10,
          postersLimit: 10,
          subscriptionTier: 'pro',
        })
      );

      render(<UsageCard />);

      const progressBar = screen.getByTestId('usage-progress');
      expect(progressBar).toHaveClass('bg-red-500');
    });
  });
```

**Step 2: Run tests to verify they fail**

Run: `cd apps/web && pnpm test usage-card.test.tsx`
Expected: FAIL (color tests fail - all show emerald)

**Step 3: Implement color logic**

Update `usage-card.tsx`:

```typescript
'use client';

import { useShallow } from 'zustand/react/shallow';
import { useUserStore, UNLIMITED } from '@/lib/stores';
import { cn } from '@/lib/utils';

interface UsageCardProps {
  className?: string;
}

const YELLOW_THRESHOLD = 50;
const RED_THRESHOLD = 80;

function getProgressColor(percentage: number, isAtLimit: boolean): string {
  if (isAtLimit) return 'bg-red-500';
  if (percentage >= RED_THRESHOLD) return 'bg-red-500';
  if (percentage >= YELLOW_THRESHOLD) return 'bg-amber-500';
  return 'bg-emerald-500';
}

export function UsageCard({ className }: UsageCardProps): JSX.Element {
  const { postersThisMonth, postersLimit } = useUserStore(
    useShallow((state) => ({
      postersThisMonth: state.postersThisMonth,
      postersLimit: state.postersLimit,
    }))
  );

  const isUnlimited = postersLimit === UNLIMITED;
  const percentage = isUnlimited ? 0 : Math.min((postersThisMonth / postersLimit) * 100, 100);
  const isAtLimit = !isUnlimited && postersThisMonth >= postersLimit;
  const progressColor = getProgressColor(percentage, isAtLimit);

  return (
    <div className={cn('rounded-xl border border-surface-800 bg-surface-900/50 p-6', className)}>
      <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-surface-800">
        <div
          data-testid="usage-progress"
          className={cn('h-full rounded-full transition-all duration-500', progressColor)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
```

**Step 4: Run tests to verify they pass**

Run: `cd apps/web && pnpm test usage-card.test.tsx`
Expected: PASS (9 tests)

**Step 5: Commit**

```bash
git add apps/web/components/dashboard/__tests__/usage-card.test.tsx apps/web/components/dashboard/usage-card.tsx
git commit -m "feat(dashboard): add color thresholds to UsageCard (ODE-72)"
```

---

## Task 4: Add Usage Display Tests and Implementation

**Files:**
- Modify: `apps/web/components/dashboard/__tests__/usage-card.test.tsx`
- Modify: `apps/web/components/dashboard/usage-card.tsx`

**Step 1: Add usage display tests**

Add after color threshold tests:

```typescript
  describe('usage display', () => {
    it('displays X / Y format for free tier', () => {
      mockUseUserStore.mockImplementation((selector) =>
        selector({
          postersThisMonth: 1,
          postersLimit: 3,
          subscriptionTier: 'free',
        })
      );

      render(<UsageCard />);

      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('/')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText(/posters used/i)).toBeInTheDocument();
    });

    it('displays remaining count for pro tier', () => {
      mockUseUserStore.mockImplementation((selector) =>
        selector({
          postersThisMonth: 8,
          postersLimit: 20,
          subscriptionTier: 'pro',
        })
      );

      render(<UsageCard />);

      expect(screen.getByText('8')).toBeInTheDocument();
      expect(screen.getByText('20')).toBeInTheDocument();
      expect(screen.getByText(/12 remaining/i)).toBeInTheDocument();
    });

    it('displays UNLIMITED for premium tier', () => {
      mockUseUserStore.mockImplementation((selector) =>
        selector({
          postersThisMonth: 50,
          postersLimit: -1,
          subscriptionTier: 'premium',
        })
      );

      render(<UsageCard />);

      expect(screen.getByText(/unlimited/i)).toBeInTheDocument();
      expect(screen.queryByTestId('usage-progress')).not.toBeInTheDocument();
    });

    it('shows limit reached message when at limit', () => {
      mockUseUserStore.mockImplementation((selector) =>
        selector({
          postersThisMonth: 3,
          postersLimit: 3,
          subscriptionTier: 'free',
        })
      );

      render(<UsageCard />);

      expect(screen.getByText(/limit reached/i)).toBeInTheDocument();
    });
  });
```

**Step 2: Run tests to verify they fail**

Run: `cd apps/web && pnpm test usage-card.test.tsx`
Expected: FAIL (usage display tests fail - no text rendered)

**Step 3: Implement usage display**

Update `usage-card.tsx`:

```typescript
'use client';

import { Sparkles, Crown } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useUserStore, UNLIMITED } from '@/lib/stores';
import { cn } from '@/lib/utils';

interface UsageCardProps {
  className?: string;
}

const YELLOW_THRESHOLD = 50;
const RED_THRESHOLD = 80;

function getProgressColor(percentage: number, isAtLimit: boolean): string {
  if (isAtLimit) return 'bg-red-500';
  if (percentage >= RED_THRESHOLD) return 'bg-red-500';
  if (percentage >= YELLOW_THRESHOLD) return 'bg-amber-500';
  return 'bg-emerald-500';
}

export function UsageCard({ className }: UsageCardProps): JSX.Element {
  const { postersThisMonth, postersLimit, subscriptionTier } = useUserStore(
    useShallow((state) => ({
      postersThisMonth: state.postersThisMonth,
      postersLimit: state.postersLimit,
      subscriptionTier: state.subscriptionTier,
    }))
  );

  const isUnlimited = postersLimit === UNLIMITED;
  const percentage = isUnlimited ? 0 : Math.min((postersThisMonth / postersLimit) * 100, 100);
  const isAtLimit = !isUnlimited && postersThisMonth >= postersLimit;
  const progressColor = getProgressColor(percentage, isAtLimit);
  const remaining = postersLimit - postersThisMonth;

  const getSubtext = (): string => {
    if (isAtLimit) return 'limit reached';
    if (subscriptionTier === 'pro') return `posters used · ${remaining} remaining`;
    return 'posters used';
  };

  return (
    <div className={cn('rounded-xl border border-surface-800 bg-surface-900/50 p-6', className)}>
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-gold-500" aria-hidden="true" />
        <span className="text-sm font-medium text-surface-300">Monthly Usage</span>
      </div>

      {isUnlimited ? (
        <div className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-gold-500" aria-hidden="true" />
          <span className="font-display text-2xl text-gold-500">UNLIMITED</span>
        </div>
      ) : (
        <>
          <div className="mb-3 flex items-baseline gap-1">
            <span className="font-display text-4xl text-white">{postersThisMonth}</span>
            <span className="text-surface-500">/</span>
            <span className="font-display text-4xl text-white">{postersLimit}</span>
            <span className="ml-2 text-surface-400">{getSubtext()}</span>
          </div>

          <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-surface-800">
            <div
              data-testid="usage-progress"
              className={cn('h-full rounded-full transition-all duration-500', progressColor)}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </>
      )}
    </div>
  );
}
```

**Step 4: Run tests to verify they pass**

Run: `cd apps/web && pnpm test usage-card.test.tsx`
Expected: PASS (13 tests)

**Step 5: Commit**

```bash
git add apps/web/components/dashboard/__tests__/usage-card.test.tsx apps/web/components/dashboard/usage-card.tsx
git commit -m "feat(dashboard): add tier-specific usage display (ODE-72)"
```

---

## Task 5: Add Upgrade CTA Tests and Implementation

**Files:**
- Modify: `apps/web/components/dashboard/__tests__/usage-card.test.tsx`
- Modify: `apps/web/components/dashboard/usage-card.tsx`

**Step 1: Add upgrade CTA tests**

Add after usage display tests:

```typescript
  describe('upgrade CTA', () => {
    it('shows upgrade CTA for free user at 80%', () => {
      mockUseUserStore.mockImplementation((selector) =>
        selector({
          postersThisMonth: 8,
          postersLimit: 10,
          subscriptionTier: 'free',
        })
      );

      render(<UsageCard />);

      const upgradeLink = screen.getByRole('link', { name: /upgrade/i });
      expect(upgradeLink).toHaveAttribute('href', '/pricing');
    });

    it('shows upgrade CTA for free user at limit', () => {
      mockUseUserStore.mockImplementation((selector) =>
        selector({
          postersThisMonth: 3,
          postersLimit: 3,
          subscriptionTier: 'free',
        })
      );

      render(<UsageCard />);

      const upgradeLink = screen.getByRole('link', { name: /upgrade/i });
      expect(upgradeLink).toBeInTheDocument();
    });

    it('hides upgrade CTA for free user under 80%', () => {
      mockUseUserStore.mockImplementation((selector) =>
        selector({
          postersThisMonth: 1,
          postersLimit: 3,
          subscriptionTier: 'free',
        })
      );

      render(<UsageCard />);

      expect(screen.queryByRole('link', { name: /upgrade/i })).not.toBeInTheDocument();
    });

    it('hides upgrade CTA for pro users', () => {
      mockUseUserStore.mockImplementation((selector) =>
        selector({
          postersThisMonth: 18,
          postersLimit: 20,
          subscriptionTier: 'pro',
        })
      );

      render(<UsageCard />);

      expect(screen.queryByRole('link', { name: /upgrade/i })).not.toBeInTheDocument();
    });

    it('hides upgrade CTA for premium users', () => {
      mockUseUserStore.mockImplementation((selector) =>
        selector({
          postersThisMonth: 100,
          postersLimit: -1,
          subscriptionTier: 'premium',
        })
      );

      render(<UsageCard />);

      expect(screen.queryByRole('link', { name: /upgrade/i })).not.toBeInTheDocument();
    });
  });
```

**Step 2: Run tests to verify they fail**

Run: `cd apps/web && pnpm test usage-card.test.tsx`
Expected: FAIL (CTA tests fail - no link rendered)

**Step 3: Implement upgrade CTA**

Update `usage-card.tsx`:

```typescript
'use client';

import Link from 'next/link';
import { Sparkles, Crown, ArrowRight } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useUserStore, UNLIMITED } from '@/lib/stores';
import { cn } from '@/lib/utils';

interface UsageCardProps {
  className?: string;
}

const YELLOW_THRESHOLD = 50;
const RED_THRESHOLD = 80;

function getProgressColor(percentage: number, isAtLimit: boolean): string {
  if (isAtLimit) return 'bg-red-500';
  if (percentage >= RED_THRESHOLD) return 'bg-red-500';
  if (percentage >= YELLOW_THRESHOLD) return 'bg-amber-500';
  return 'bg-emerald-500';
}

export function UsageCard({ className }: UsageCardProps): JSX.Element {
  const { postersThisMonth, postersLimit, subscriptionTier } = useUserStore(
    useShallow((state) => ({
      postersThisMonth: state.postersThisMonth,
      postersLimit: state.postersLimit,
      subscriptionTier: state.subscriptionTier,
    }))
  );

  const isUnlimited = postersLimit === UNLIMITED;
  const percentage = isUnlimited ? 0 : Math.min((postersThisMonth / postersLimit) * 100, 100);
  const isAtLimit = !isUnlimited && postersThisMonth >= postersLimit;
  const progressColor = getProgressColor(percentage, isAtLimit);
  const remaining = postersLimit - postersThisMonth;
  const showUpgradeCTA = subscriptionTier === 'free' && percentage >= RED_THRESHOLD;

  const getSubtext = (): string => {
    if (isAtLimit) return 'limit reached';
    if (subscriptionTier === 'pro') return `posters used · ${remaining} remaining`;
    return 'posters used';
  };

  return (
    <div className={cn('rounded-xl border border-surface-800 bg-surface-900/50 p-6', className)}>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-gold-500" aria-hidden="true" />
            <span className="text-sm font-medium text-surface-300">Monthly Usage</span>
          </div>

          {isUnlimited ? (
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-gold-500" aria-hidden="true" />
              <span className="font-display text-2xl text-gold-500">UNLIMITED</span>
            </div>
          ) : (
            <>
              <div className="mb-3 flex items-baseline gap-1">
                <span className="font-display text-4xl text-white">{postersThisMonth}</span>
                <span className="text-surface-500">/</span>
                <span className="font-display text-4xl text-white">{postersLimit}</span>
                <span className="ml-2 text-surface-400">{getSubtext()}</span>
              </div>

              <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-surface-800">
                <div
                  data-testid="usage-progress"
                  className={cn('h-full rounded-full transition-all duration-500', progressColor)}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </>
          )}
        </div>

        {showUpgradeCTA && (
          <Link
            href="/pricing"
            className="group inline-flex items-center gap-2 rounded-lg border border-gold-500/30 bg-gold-500/10 px-4 py-2.5 text-sm font-medium text-gold-400 transition-all hover:border-gold-500/50 hover:bg-gold-500/20 hover:text-gold-300"
          >
            <Crown className="h-4 w-4" aria-hidden="true" />
            Upgrade to Pro
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        )}
      </div>
    </div>
  );
}
```

**Step 4: Run tests to verify they pass**

Run: `cd apps/web && pnpm test usage-card.test.tsx`
Expected: PASS (18 tests)

**Step 5: Commit**

```bash
git add apps/web/components/dashboard/__tests__/usage-card.test.tsx apps/web/components/dashboard/usage-card.tsx
git commit -m "feat(dashboard): add upgrade CTA to UsageCard (ODE-72)"
```

---

## Task 6: Add Accessibility Attributes

**Files:**
- Modify: `apps/web/components/dashboard/__tests__/usage-card.test.tsx`
- Modify: `apps/web/components/dashboard/usage-card.tsx`

**Step 1: Add accessibility test**

Add after upgrade CTA tests:

```typescript
  describe('accessibility', () => {
    it('has accessible progress bar with aria attributes', () => {
      mockUseUserStore.mockImplementation((selector) =>
        selector({
          postersThisMonth: 5,
          postersLimit: 10,
          subscriptionTier: 'pro',
        })
      );

      render(<UsageCard />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '5');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '10');
      expect(progressBar).toHaveAttribute('aria-label', '5 of 10 posters used');
    });
  });
```

**Step 2: Run test to verify it fails**

Run: `cd apps/web && pnpm test usage-card.test.tsx`
Expected: FAIL (no progressbar role found)

**Step 3: Add aria attributes to progress bar container**

In `usage-card.tsx`, update the progress bar container div (the one with `bg-surface-800`):

```typescript
              <div
                role="progressbar"
                aria-valuenow={postersThisMonth}
                aria-valuemin={0}
                aria-valuemax={postersLimit}
                aria-label={`${postersThisMonth} of ${postersLimit} posters used`}
                className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-surface-800"
              >
                <div
                  data-testid="usage-progress"
                  className={cn('h-full rounded-full transition-all duration-500', progressColor)}
                  style={{ width: `${percentage}%` }}
                />
              </div>
```

**Step 4: Run tests to verify they pass**

Run: `cd apps/web && pnpm test usage-card.test.tsx`
Expected: PASS (19 tests)

**Step 5: Commit**

```bash
git add apps/web/components/dashboard/__tests__/usage-card.test.tsx apps/web/components/dashboard/usage-card.tsx
git commit -m "feat(dashboard): add accessibility to UsageCard (ODE-72)"
```

---

## Task 7: Export UsageCard from Dashboard Index

**Files:**
- Modify: `apps/web/components/dashboard/index.ts`

**Step 1: Add UsageCard export**

```typescript
export { CreateNewCard } from './create-new-card';
export { DashboardHeader } from './dashboard-header';
export { UsageCard } from './usage-card';
export { WelcomeSection } from './welcome-section';
```

**Step 2: Run all dashboard tests to verify nothing broke**

Run: `cd apps/web && pnpm test components/dashboard`
Expected: PASS (all tests)

**Step 3: Commit**

```bash
git add apps/web/components/dashboard/index.ts
git commit -m "feat(dashboard): export UsageCard from index (ODE-72)"
```

---

## Task 8: Refactor WelcomeSection to Use UsageCard

**Files:**
- Modify: `apps/web/components/dashboard/welcome-section.tsx`
- Modify: `apps/web/components/dashboard/__tests__/welcome-section.test.tsx`

**Step 1: Update WelcomeSection to use UsageCard**

```typescript
'use client';

import { useShallow } from 'zustand/react/shallow';
import { useUserStore, UNLIMITED } from '@/lib/stores';
import { UsageCard } from './usage-card';

export function WelcomeSection(): JSX.Element {
  const { user, postersThisMonth, postersLimit } = useUserStore(
    useShallow((state) => ({
      user: state.user,
      postersThisMonth: state.postersThisMonth,
      postersLimit: state.postersLimit,
    }))
  );

  const isUnlimited = postersLimit === UNLIMITED;
  const isAtLimit = !isUnlimited && postersThisMonth >= postersLimit;
  const userName = user?.name?.split(' ')[0] || '';

  return (
    <section className="mb-8">
      {/* Welcome Header */}
      <div className="mb-6">
        <h1 className="font-display text-4xl tracking-wide text-white md:text-5xl">
          WELCOME BACK{userName ? `, ${userName.toUpperCase()}` : ''}
        </h1>
        <p className="mt-2 text-surface-400">
          {isAtLimit
            ? "You've reached your monthly limit. Upgrade to create more posters."
            : 'Ready to create your next championship poster?'}
        </p>
      </div>

      {/* Usage Card */}
      <UsageCard />
    </section>
  );
}
```

**Step 2: Update WelcomeSection tests**

Remove tests that are now covered by UsageCard tests. Keep only WelcomeSection-specific tests:

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WelcomeSection } from '../welcome-section';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock the user store
const mockUseUserStore = vi.fn();
vi.mock('@/lib/stores', () => ({
  useUserStore: (selector: (state: unknown) => unknown) => mockUseUserStore(selector),
  UNLIMITED: -1,
}));

// Mock UsageCard since it has its own tests
vi.mock('../usage-card', () => ({
  UsageCard: () => <div data-testid="usage-card-mock">UsageCard</div>,
}));

describe('WelcomeSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays welcome message with user name', () => {
    mockUseUserStore.mockImplementation((selector) =>
      selector({
        user: { name: 'John Doe', email: 'john@example.com' },
        postersThisMonth: 2,
        postersLimit: 5,
      })
    );

    render(<WelcomeSection />);

    expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
    expect(screen.getByText(/john/i)).toBeInTheDocument();
  });

  it('displays generic welcome when no user name', () => {
    mockUseUserStore.mockImplementation((selector) =>
      selector({
        user: null,
        postersThisMonth: 0,
        postersLimit: 3,
      })
    );

    render(<WelcomeSection />);

    expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
  });

  it('shows at-limit message when user has reached quota', () => {
    mockUseUserStore.mockImplementation((selector) =>
      selector({
        user: { name: 'John', email: 'john@example.com' },
        postersThisMonth: 3,
        postersLimit: 3,
      })
    );

    render(<WelcomeSection />);

    expect(screen.getByText(/reached your monthly limit/i)).toBeInTheDocument();
  });

  it('shows ready message when user has quota remaining', () => {
    mockUseUserStore.mockImplementation((selector) =>
      selector({
        user: { name: 'John', email: 'john@example.com' },
        postersThisMonth: 1,
        postersLimit: 3,
      })
    );

    render(<WelcomeSection />);

    expect(screen.getByText(/ready to create/i)).toBeInTheDocument();
  });

  it('renders UsageCard component', () => {
    mockUseUserStore.mockImplementation((selector) =>
      selector({
        user: null,
        postersThisMonth: 0,
        postersLimit: 3,
      })
    );

    render(<WelcomeSection />);

    expect(screen.getByTestId('usage-card-mock')).toBeInTheDocument();
  });
});
```

**Step 3: Run all dashboard tests**

Run: `cd apps/web && pnpm test components/dashboard`
Expected: PASS (all tests)

**Step 4: Commit**

```bash
git add apps/web/components/dashboard/welcome-section.tsx apps/web/components/dashboard/__tests__/welcome-section.test.tsx
git commit -m "refactor(dashboard): WelcomeSection uses UsageCard (ODE-72)"
```

---

## Task 9: Run Full Test Suite and Type Check

**Files:** None (verification only)

**Step 1: Run full test suite**

Run: `cd apps/web && pnpm test`
Expected: PASS (all tests)

**Step 2: Run type check**

Run: `cd apps/web && pnpm type-check`
Expected: No errors

**Step 3: Run lint**

Run: `cd apps/web && pnpm lint`
Expected: No errors

---

## Task 10: Visual Verification (Manual)

**Step 1: Start dev server**

Run: `pnpm dev`

**Step 2: Verify in browser**

Navigate to http://localhost:3000/dashboard and verify:
- [ ] UsageCard displays correctly
- [ ] Progress bar fills correctly
- [ ] Colors change at thresholds (test by modifying store)
- [ ] Upgrade CTA appears for free users at 80%+
- [ ] Premium tier shows UNLIMITED

---

## Summary

After completing all tasks, you will have:
- `UsageCard` component with full test coverage
- `WelcomeSection` refactored to use `UsageCard`
- All tests passing
- Type-safe implementation
- Accessible progress bar
