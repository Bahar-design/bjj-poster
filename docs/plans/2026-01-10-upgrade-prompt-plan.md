# UpgradePrompt Component Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a reusable UpgradePrompt component with banner/card/modal variants for consistent upgrade CTAs.

**Architecture:** Single component with variant prop controlling layout. Stub analytics utility for event tracking. Tier benefits extracted to data file.

**Tech Stack:** React, TypeScript, Tailwind CSS, shadcn/ui (Dialog, Button), Lucide icons

---

## Task 1: Create Analytics Stub

**Files:**
- Create: `apps/web/lib/analytics.ts`
- Test: `apps/web/lib/__tests__/analytics.test.ts`

**Step 1: Write the failing test**

```typescript
// apps/web/lib/__tests__/analytics.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { track } from '../analytics'

describe('analytics', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  it('logs event to console in development', () => {
    track('upgrade_prompt_viewed', {
      source: 'test',
      targetTier: 'pro',
      variant: 'banner',
    })

    expect(console.log).toHaveBeenCalledWith(
      '[Analytics]',
      'upgrade_prompt_viewed',
      { source: 'test', targetTier: 'pro', variant: 'banner' }
    )
  })

  it('accepts all valid event types', () => {
    const events = [
      'upgrade_prompt_viewed',
      'upgrade_prompt_clicked',
      'upgrade_prompt_dismissed',
    ] as const

    events.forEach((event) => {
      expect(() =>
        track(event, { source: 'test', targetTier: 'premium', variant: 'card' })
      ).not.toThrow()
    })
  })
})
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter web test -- apps/web/lib/__tests__/analytics.test.ts`
Expected: FAIL with "Cannot find module '../analytics'"

**Step 3: Write minimal implementation**

```typescript
// apps/web/lib/analytics.ts
export type AnalyticsEvent =
  | 'upgrade_prompt_viewed'
  | 'upgrade_prompt_clicked'
  | 'upgrade_prompt_dismissed'

export interface EventProperties {
  source: string
  targetTier: 'pro' | 'premium'
  variant: 'banner' | 'card' | 'modal'
}

export function track(event: AnalyticsEvent, properties: EventProperties): void {
  // Development: log to console
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Analytics]', event, properties)
  }

  // Production: no-op until real provider configured
  // TODO: Wire to Segment/Posthog/etc
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter web test -- apps/web/lib/__tests__/analytics.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/lib/analytics.ts apps/web/lib/__tests__/analytics.test.ts
git commit -m "feat(analytics): add stub analytics utility for tracking"
```

---

## Task 2: Create Tier Benefits Data

**Files:**
- Create: `apps/web/components/upgrade/tier-benefits.ts`
- Test: `apps/web/components/upgrade/__tests__/tier-benefits.test.ts`

**Step 1: Write the failing test**

```typescript
// apps/web/components/upgrade/__tests__/tier-benefits.test.ts
import { describe, it, expect } from 'vitest'
import { getTierBenefits, getTierHeadline } from '../tier-benefits'

describe('tier-benefits', () => {
  describe('getTierBenefits', () => {
    it('returns pro benefits', () => {
      const benefits = getTierBenefits('pro')
      expect(benefits).toHaveLength(4)
      expect(benefits[0]).toBe('20 posters/month')
    })

    it('returns premium benefits', () => {
      const benefits = getTierBenefits('premium')
      expect(benefits).toHaveLength(4)
      expect(benefits[0]).toBe('Unlimited posters')
    })
  })

  describe('getTierHeadline', () => {
    it('returns pro headline', () => {
      expect(getTierHeadline('pro')).toBe('Upgrade to Pro')
    })

    it('returns premium headline', () => {
      expect(getTierHeadline('premium')).toBe('Upgrade to Premium')
    })
  })
})
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter web test -- apps/web/components/upgrade/__tests__/tier-benefits.test.ts`
Expected: FAIL with "Cannot find module '../tier-benefits'"

**Step 3: Write minimal implementation**

```typescript
// apps/web/components/upgrade/tier-benefits.ts
export type TargetTier = 'pro' | 'premium'

const TIER_BENEFITS: Record<TargetTier, string[]> = {
  pro: ['20 posters/month', 'HD exports', 'No watermark', 'Priority templates'],
  premium: [
    'Unlimited posters',
    '4K exports',
    'Priority support',
    'Custom branding',
  ],
}

const TIER_HEADLINES: Record<TargetTier, string> = {
  pro: 'Upgrade to Pro',
  premium: 'Upgrade to Premium',
}

export function getTierBenefits(tier: TargetTier): string[] {
  return TIER_BENEFITS[tier]
}

export function getTierHeadline(tier: TargetTier): string {
  return TIER_HEADLINES[tier]
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter web test -- apps/web/components/upgrade/__tests__/tier-benefits.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/components/upgrade/tier-benefits.ts apps/web/components/upgrade/__tests__/tier-benefits.test.ts
git commit -m "feat(upgrade): add tier benefits data"
```

---

## Task 3: Create UpgradePrompt Component - Banner Variant

**Files:**
- Create: `apps/web/components/upgrade/upgrade-prompt.tsx`
- Test: `apps/web/components/upgrade/__tests__/upgrade-prompt.test.tsx`

**Step 1: Write the failing test for banner variant**

```typescript
// apps/web/components/upgrade/__tests__/upgrade-prompt.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UpgradePrompt } from '../upgrade-prompt'

// Mock analytics
vi.mock('@/lib/analytics', () => ({
  track: vi.fn(),
}))

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

describe('UpgradePrompt', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('banner variant', () => {
    it('renders banner with upgrade message', () => {
      render(
        <UpgradePrompt variant="banner" targetTier="pro" source="test" />
      )

      expect(screen.getByText(/Upgrade to Pro/i)).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /upgrade now/i })).toHaveAttribute(
        'href',
        '/pricing'
      )
    })

    it('shows close button when onDismiss provided', async () => {
      const onDismiss = vi.fn()
      const user = userEvent.setup()

      render(
        <UpgradePrompt
          variant="banner"
          targetTier="pro"
          source="test"
          onDismiss={onDismiss}
        />
      )

      const closeButton = screen.getByRole('button', { name: /close/i })
      await user.click(closeButton)

      expect(onDismiss).toHaveBeenCalledTimes(1)
    })

    it('hides close button when onDismiss not provided', () => {
      render(
        <UpgradePrompt variant="banner" targetTier="pro" source="test" />
      )

      expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument()
    })
  })
})
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter web test -- apps/web/components/upgrade/__tests__/upgrade-prompt.test.tsx`
Expected: FAIL with "Cannot find module '../upgrade-prompt'"

**Step 3: Write minimal implementation for banner**

```typescript
// apps/web/components/upgrade/upgrade-prompt.tsx
'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { track } from '@/lib/analytics'
import { getTierBenefits, getTierHeadline, type TargetTier } from './tier-benefits'
import { cn } from '@/lib/utils'

export type UpgradePromptVariant = 'banner' | 'card' | 'modal'

export interface UpgradePromptProps {
  variant: UpgradePromptVariant
  targetTier: TargetTier
  source: string
  onDismiss?: () => void
}

export function UpgradePrompt({
  variant,
  targetTier,
  source,
  onDismiss,
}: UpgradePromptProps) {
  const headline = getTierHeadline(targetTier)
  const benefits = getTierBenefits(targetTier)

  useEffect(() => {
    track('upgrade_prompt_viewed', { source, targetTier, variant })
  }, [source, targetTier, variant])

  const handleCtaClick = () => {
    track('upgrade_prompt_clicked', { source, targetTier, variant })
  }

  const handleDismiss = () => {
    track('upgrade_prompt_dismissed', { source, targetTier, variant })
    onDismiss?.()
  }

  if (variant === 'banner') {
    return (
      <div className="flex items-center justify-between gap-4 rounded-lg border border-gold-500/20 bg-gold-500/10 px-4 py-3">
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-gold-500" />
          <p className="text-sm font-medium text-surface-100">
            {headline} for {benefits[0].toLowerCase()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" className="bg-gold-500 hover:bg-gold-600 text-surface-950">
            <Link href="/pricing" onClick={handleCtaClick}>
              Upgrade Now
            </Link>
          </Button>
          {onDismiss && (
            <button
              onClick={handleDismiss}
              className="p-1 text-surface-400 hover:text-surface-200"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    )
  }

  // Placeholder for other variants
  return null
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter web test -- apps/web/components/upgrade/__tests__/upgrade-prompt.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/components/upgrade/upgrade-prompt.tsx apps/web/components/upgrade/__tests__/upgrade-prompt.test.tsx
git commit -m "feat(upgrade): add UpgradePrompt banner variant"
```

---

## Task 4: Add Card Variant

**Files:**
- Modify: `apps/web/components/upgrade/upgrade-prompt.tsx`
- Modify: `apps/web/components/upgrade/__tests__/upgrade-prompt.test.tsx`

**Step 1: Add failing tests for card variant**

Add to the existing test file:

```typescript
// Add to apps/web/components/upgrade/__tests__/upgrade-prompt.test.tsx

  describe('card variant', () => {
    it('renders card with headline and benefits list', () => {
      render(
        <UpgradePrompt variant="card" targetTier="pro" source="test" />
      )

      expect(screen.getByText('Upgrade to Pro')).toBeInTheDocument()
      expect(screen.getByText('20 posters/month')).toBeInTheDocument()
      expect(screen.getByText('HD exports')).toBeInTheDocument()
      expect(screen.getByText('No watermark')).toBeInTheDocument()
      expect(screen.getByText('Priority templates')).toBeInTheDocument()
    })

    it('renders premium benefits when targetTier is premium', () => {
      render(
        <UpgradePrompt variant="card" targetTier="premium" source="test" />
      )

      expect(screen.getByText('Upgrade to Premium')).toBeInTheDocument()
      expect(screen.getByText('Unlimited posters')).toBeInTheDocument()
      expect(screen.getByText('4K exports')).toBeInTheDocument()
    })

    it('has CTA link to pricing', () => {
      render(
        <UpgradePrompt variant="card" targetTier="pro" source="test" />
      )

      expect(screen.getByRole('link', { name: /upgrade now/i })).toHaveAttribute(
        'href',
        '/pricing'
      )
    })
  })
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter web test -- apps/web/components/upgrade/__tests__/upgrade-prompt.test.tsx`
Expected: FAIL (card variant returns null)

**Step 3: Implement card variant**

Update the component to add card variant before the `return null`:

```typescript
// Add to upgrade-prompt.tsx before the final return null

  if (variant === 'card') {
    return (
      <div className="relative rounded-lg border border-gold-500/20 bg-surface-900/80 p-6 backdrop-blur">
        {onDismiss && (
          <button
            onClick={handleDismiss}
            className="absolute right-3 top-3 p-1 text-surface-400 hover:text-surface-200"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <div className="flex items-center gap-2 mb-4">
          <Crown className="h-6 w-6 text-gold-500" />
          <h3 className="font-display text-xl text-surface-100">{headline}</h3>
        </div>
        <ul className="mb-6 space-y-2">
          {benefits.map((benefit) => (
            <li key={benefit} className="flex items-center gap-2 text-sm text-surface-300">
              <Check className="h-4 w-4 text-gold-500" />
              {benefit}
            </li>
          ))}
        </ul>
        <Button asChild className="w-full bg-gold-500 hover:bg-gold-600 text-surface-950">
          <Link href="/pricing" onClick={handleCtaClick}>
            Upgrade Now
          </Link>
        </Button>
      </div>
    )
  }
```

Also add imports at the top:
```typescript
import { Sparkles, X, Crown, Check } from 'lucide-react'
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter web test -- apps/web/components/upgrade/__tests__/upgrade-prompt.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/components/upgrade/upgrade-prompt.tsx apps/web/components/upgrade/__tests__/upgrade-prompt.test.tsx
git commit -m "feat(upgrade): add UpgradePrompt card variant"
```

---

## Task 5: Add Modal Variant

**Files:**
- Modify: `apps/web/components/upgrade/upgrade-prompt.tsx`
- Modify: `apps/web/components/upgrade/__tests__/upgrade-prompt.test.tsx`

**Step 1: Add failing tests for modal variant**

Add to the existing test file:

```typescript
// Add to apps/web/components/upgrade/__tests__/upgrade-prompt.test.tsx

  describe('modal variant', () => {
    it('renders modal with headline and benefits', () => {
      render(
        <UpgradePrompt
          variant="modal"
          targetTier="pro"
          source="test"
          onDismiss={() => {}}
        />
      )

      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Upgrade to Pro')).toBeInTheDocument()
      expect(screen.getByText('20 posters/month')).toBeInTheDocument()
    })

    it('calls onDismiss when close button clicked', async () => {
      const onDismiss = vi.fn()
      const user = userEvent.setup()

      render(
        <UpgradePrompt
          variant="modal"
          targetTier="premium"
          source="test"
          onDismiss={onDismiss}
        />
      )

      const closeButton = screen.getByRole('button', { name: /close/i })
      await user.click(closeButton)

      expect(onDismiss).toHaveBeenCalledTimes(1)
    })
  })
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter web test -- apps/web/components/upgrade/__tests__/upgrade-prompt.test.tsx`
Expected: FAIL (modal variant returns null)

**Step 3: Implement modal variant**

Update the component to add modal variant before the final `return null`:

```typescript
// Add to upgrade-prompt.tsx before the final return null

  if (variant === 'modal') {
    return (
      <Dialog open onOpenChange={(open) => !open && handleDismiss()}>
        <DialogContent className="border-gold-500/20 bg-surface-900 sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Crown className="h-6 w-6 text-gold-500" />
              <DialogTitle className="font-display text-2xl">{headline}</DialogTitle>
            </div>
          </DialogHeader>
          <ul className="my-4 space-y-3">
            {benefits.map((benefit) => (
              <li key={benefit} className="flex items-center gap-2 text-surface-300">
                <Check className="h-5 w-5 text-gold-500" />
                {benefit}
              </li>
            ))}
          </ul>
          <Button asChild className="w-full bg-gold-500 hover:bg-gold-600 text-surface-950">
            <Link href="/pricing" onClick={handleCtaClick}>
              Upgrade Now
            </Link>
          </Button>
        </DialogContent>
      </Dialog>
    )
  }
```

Add imports at the top:
```typescript
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter web test -- apps/web/components/upgrade/__tests__/upgrade-prompt.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/components/upgrade/upgrade-prompt.tsx apps/web/components/upgrade/__tests__/upgrade-prompt.test.tsx
git commit -m "feat(upgrade): add UpgradePrompt modal variant"
```

---

## Task 6: Add Analytics Event Tests

**Files:**
- Modify: `apps/web/components/upgrade/__tests__/upgrade-prompt.test.tsx`

**Step 1: Add failing tests for analytics**

Add to the existing test file:

```typescript
// Add to apps/web/components/upgrade/__tests__/upgrade-prompt.test.tsx
import { track } from '@/lib/analytics'

  describe('analytics', () => {
    it('tracks upgrade_prompt_viewed on mount', () => {
      render(
        <UpgradePrompt variant="banner" targetTier="pro" source="dashboard" />
      )

      expect(track).toHaveBeenCalledWith('upgrade_prompt_viewed', {
        source: 'dashboard',
        targetTier: 'pro',
        variant: 'banner',
      })
    })

    it('tracks upgrade_prompt_clicked on CTA click', async () => {
      const user = userEvent.setup()
      render(
        <UpgradePrompt variant="card" targetTier="premium" source="sidebar" />
      )

      await user.click(screen.getByRole('link', { name: /upgrade now/i }))

      expect(track).toHaveBeenCalledWith('upgrade_prompt_clicked', {
        source: 'sidebar',
        targetTier: 'premium',
        variant: 'card',
      })
    })

    it('tracks upgrade_prompt_dismissed on close', async () => {
      const user = userEvent.setup()
      const onDismiss = vi.fn()

      render(
        <UpgradePrompt
          variant="banner"
          targetTier="pro"
          source="header"
          onDismiss={onDismiss}
        />
      )

      await user.click(screen.getByRole('button', { name: /close/i }))

      expect(track).toHaveBeenCalledWith('upgrade_prompt_dismissed', {
        source: 'header',
        targetTier: 'pro',
        variant: 'banner',
      })
    })
  })
```

**Step 2: Run test to verify it passes**

Run: `pnpm --filter web test -- apps/web/components/upgrade/__tests__/upgrade-prompt.test.tsx`
Expected: PASS (analytics already implemented)

**Step 3: Commit**

```bash
git add apps/web/components/upgrade/__tests__/upgrade-prompt.test.tsx
git commit -m "test(upgrade): add analytics event tests"
```

---

## Task 7: Create Barrel Export

**Files:**
- Create: `apps/web/components/upgrade/index.ts`

**Step 1: Create barrel export**

```typescript
// apps/web/components/upgrade/index.ts
export { UpgradePrompt, type UpgradePromptProps, type UpgradePromptVariant } from './upgrade-prompt'
export { getTierBenefits, getTierHeadline, type TargetTier } from './tier-benefits'
```

**Step 2: Verify exports work**

Run: `pnpm --filter web type-check`
Expected: PASS

**Step 3: Commit**

```bash
git add apps/web/components/upgrade/index.ts
git commit -m "feat(upgrade): add barrel exports"
```

---

## Task 8: Final Quality Check

**Step 1: Run all tests**

Run: `pnpm test`
Expected: All tests pass

**Step 2: Run linter**

Run: `pnpm lint`
Expected: No errors

**Step 3: Run type check**

Run: `pnpm type-check`
Expected: No errors

**Step 4: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix(upgrade): address quality gate issues"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Analytics stub | `lib/analytics.ts` |
| 2 | Tier benefits data | `upgrade/tier-benefits.ts` |
| 3 | Banner variant | `upgrade/upgrade-prompt.tsx` |
| 4 | Card variant | `upgrade/upgrade-prompt.tsx` |
| 5 | Modal variant | `upgrade/upgrade-prompt.tsx` |
| 6 | Analytics tests | `upgrade/__tests__/upgrade-prompt.test.tsx` |
| 7 | Barrel export | `upgrade/index.ts` |
| 8 | Quality check | - |
