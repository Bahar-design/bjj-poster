# Premium Upsell Flow Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement 5 upsell components to alert non-paid users about premium services throughout the builder flow.

**Architecture:** Add new components for feature teaser strip and output quality card. Enhance existing QuotaBadge and TemplateCard with upgrade CTAs. Add contextual banners at engagement moments. All changes conditional on `subscriptionTier === 'free'`.

**Tech Stack:** React, TypeScript, Zustand, Tailwind CSS, Lucide icons, existing UpgradePrompt component

---

## Task 1: Extend Template Type with Tier Field

**Files:**
- Modify: `apps/web/lib/types/api.ts:4-9`
- Test: `apps/web/lib/types/api.test.ts` (create)

**Step 1: Add tier field to Template interface**

Edit `apps/web/lib/types/api.ts`:

```typescript
/**
 * Template entity from the API
 */
export interface Template {
  id: string;
  name: string;
  category: string;
  thumbnailUrl: string;
  /** Subscription tier required to use this template. Defaults to 'free' if not specified. */
  tier?: 'free' | 'pro' | 'premium';
}
```

**Step 2: Commit**

```bash
git add apps/web/lib/types/api.ts
git commit -m "feat(types): add tier field to Template interface"
```

---

## Task 2: Add New Analytics Events

**Files:**
- Modify: `apps/web/lib/analytics.ts:2-13`

**Step 1: Add new event types**

Edit `apps/web/lib/analytics.ts`, update the AnalyticsEvent type:

```typescript
export type AnalyticsEvent =
  | 'upgrade_prompt_viewed'
  | 'upgrade_prompt_clicked'
  | 'upgrade_prompt_dismissed'
  | 'quota_limit_modal_viewed'
  | 'quota_limit_upgrade_clicked'
  | 'quota_limit_maybe_later_clicked'
  | 'first_poster_celebration_viewed'
  | 'first_poster_downloaded'
  | 'first_poster_shared'
  | 'first_poster_celebration_dismissed'
  // New events for premium upsell flow
  | 'quota_badge_upgrade_clicked'
  | 'feature_teaser_viewed'
  | 'feature_teaser_clicked'
  | 'feature_teaser_dismissed'
  | 'template_tier_upgrade_clicked'
  | 'output_preview_compare_clicked'
  | 'contextual_banner_viewed'
  | 'contextual_banner_clicked'
  | 'contextual_banner_dismissed'
```

**Step 2: Add new property interfaces**

Add after existing interfaces:

```typescript
export interface QuotaBadgeProperties {
  usage_percentage: number
  posters_remaining: number
}

export interface FeatureTeaserProperties {
  source: string
}

export interface TemplateTierProperties {
  template_id: string
  template_tier: 'pro' | 'premium'
}

export interface OutputPreviewProperties {
  current_tier: string
}

export interface ContextualBannerProperties {
  banner_id: string
  trigger: string
}
```

**Step 3: Update EventProperties union**

```typescript
export type EventProperties =
  | UpgradePromptProperties
  | QuotaLimitProperties
  | FirstPosterCelebrationProperties
  | QuotaBadgeProperties
  | FeatureTeaserProperties
  | TemplateTierProperties
  | OutputPreviewProperties
  | ContextualBannerProperties
```

**Step 4: Commit**

```bash
git add apps/web/lib/analytics.ts
git commit -m "feat(analytics): add premium upsell tracking events"
```

---

## Task 3: Enhanced QuotaBadge with Upgrade CTA

**Files:**
- Modify: `apps/web/components/builder/quota-badge.tsx`
- Test: `apps/web/components/builder/__tests__/quota-badge.test.tsx`

**Step 1: Write failing tests**

Add to `apps/web/components/builder/__tests__/quota-badge.test.tsx`:

```typescript
describe('upgrade behavior', () => {
  it('shows upgrade tooltip when usage >= 50%', async () => {
    useUserStore.setState({ postersThisMonth: 2, postersLimit: 3 });
    render(<QuotaBadge />);

    const badge = screen.getByRole('button');
    await userEvent.click(badge);

    expect(screen.getByText(/running low/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /view plans/i })).toHaveAttribute('href', '/pricing');
  });

  it('shows crown icon when usage >= 80%', () => {
    useUserStore.setState({ postersThisMonth: 3, postersLimit: 3 });
    render(<QuotaBadge />);

    expect(screen.getByTestId('crown-icon')).toBeInTheDocument();
  });

  it('does not show upgrade UI when usage < 50%', () => {
    useUserStore.setState({ postersThisMonth: 1, postersLimit: 3 });
    render(<QuotaBadge />);

    expect(screen.queryByTestId('crown-icon')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
pnpm test apps/web/components/builder/__tests__/quota-badge.test.tsx
```
Expected: FAIL

**Step 3: Implement enhanced QuotaBadge**

Replace `apps/web/components/builder/quota-badge.tsx`:

```typescript
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Crown } from 'lucide-react';
import { useUserStore } from '@/lib/stores';
import { track } from '@/lib/analytics';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface QuotaBadgeProps {
  className?: string;
}

export function QuotaBadge({ className }: QuotaBadgeProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const postersThisMonth = useUserStore((state) => state.postersThisMonth);
  const postersLimit = useUserStore((state) => state.postersLimit);

  const percentage = postersLimit > 0 ? (postersThisMonth / postersLimit) * 100 : 0;
  const remaining = postersLimit - postersThisMonth;
  const showUpgradeUI = percentage >= 50;
  const showCrownIcon = percentage >= 80;

  const dotColor =
    percentage < 50
      ? 'bg-emerald-500 shadow-emerald-500/50'
      : percentage < 80
        ? 'bg-amber-500 shadow-amber-500/50'
        : 'bg-red-500 shadow-red-500/50';

  const handleUpgradeClick = () => {
    track('quota_badge_upgrade_clicked', {
      usage_percentage: Math.round(percentage),
      posters_remaining: remaining,
    });
  };

  const badgeContent = (
    <div
      className={cn(
        'flex items-center gap-2.5 rounded-full border bg-surface-900/50 px-3 py-1.5 transition-all duration-300',
        showUpgradeUI
          ? 'border-gold-500/30 hover:border-gold-500/50 cursor-pointer'
          : 'border-surface-800',
        className
      )}
    >
      {showCrownIcon && (
        <Crown
          data-testid="crown-icon"
          className="h-3 w-3 text-gold-500/70 animate-in fade-in duration-300"
        />
      )}
      <div
        data-testid="quota-dot"
        className={cn('h-2 w-2 rounded-full shadow-sm', dotColor)}
      />
      <span className="text-sm text-surface-400">
        <span className="font-semibold text-white">{postersThisMonth}</span>
        <span className="mx-1 text-surface-600">/</span>
        <span className="font-semibold text-white">{postersLimit}</span>
        <span className="ml-1 text-surface-500">used</span>
      </span>
    </div>
  );

  if (!showUpgradeUI) {
    return badgeContent;
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button type="button" aria-label="View usage and upgrade options">
          {badgeContent}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-64 border-surface-700 bg-surface-900 p-4"
        align="end"
      >
        <p className="mb-3 text-sm text-surface-300">
          {showCrownIcon
            ? `${remaining <= 0 ? 'No' : remaining} poster${remaining === 1 ? '' : 's'} left`
            : 'Running low on posters?'}
        </p>
        <p className="mb-4 text-xs text-surface-400">
          Upgrade for more posters and premium features.
        </p>
        <Link
          href="/pricing"
          onClick={handleUpgradeClick}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gold-500 hover:text-gold-400 transition-colors"
        >
          View Plans
          <span aria-hidden="true">→</span>
        </Link>
      </PopoverContent>
    </Popover>
  );
}
```

**Step 4: Run tests to verify they pass**

```bash
pnpm test apps/web/components/builder/__tests__/quota-badge.test.tsx
```
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/components/builder/quota-badge.tsx apps/web/components/builder/__tests__/quota-badge.test.tsx
git commit -m "feat(builder): add upgrade CTA to QuotaBadge at 50%+ usage"
```

---

## Task 4: Create Premium Feature Teaser Strip

**Files:**
- Create: `apps/web/components/builder/premium-feature-strip.tsx`
- Create: `apps/web/components/builder/__tests__/premium-feature-strip.test.tsx`
- Modify: `apps/web/components/builder/index.ts`

**Step 1: Write failing tests**

Create `apps/web/components/builder/__tests__/premium-feature-strip.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PremiumFeatureStrip } from '../premium-feature-strip';
import { useUserStore } from '@/lib/stores';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('PremiumFeatureStrip', () => {
  beforeEach(() => {
    localStorageMock.clear();
    useUserStore.setState({ subscriptionTier: 'free' });
  });

  it('renders for free tier users', () => {
    render(<PremiumFeatureStrip />);

    expect(screen.getByText(/HD Export/i)).toBeInTheDocument();
    expect(screen.getByText(/No Watermark/i)).toBeInTheDocument();
    expect(screen.getByText(/Background Removal/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /unlock with pro/i })).toHaveAttribute('href', '/pricing');
  });

  it('does not render for pro tier users', () => {
    useUserStore.setState({ subscriptionTier: 'pro' });
    render(<PremiumFeatureStrip />);

    expect(screen.queryByText(/HD Export/i)).not.toBeInTheDocument();
  });

  it('can be dismissed and stays dismissed for session', async () => {
    render(<PremiumFeatureStrip />);

    const dismissButton = screen.getByRole('button', { name: /dismiss/i });
    await userEvent.click(dismissButton);

    expect(screen.queryByText(/HD Export/i)).not.toBeInTheDocument();
    expect(localStorageMock.getItem('premium-feature-strip-dismissed')).toBe('true');
  });

  it('does not render if previously dismissed', () => {
    localStorageMock.setItem('premium-feature-strip-dismissed', 'true');
    render(<PremiumFeatureStrip />);

    expect(screen.queryByText(/HD Export/i)).not.toBeInTheDocument();
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
pnpm test apps/web/components/builder/__tests__/premium-feature-strip.test.tsx
```
Expected: FAIL (module not found)

**Step 3: Create the component**

Create `apps/web/components/builder/premium-feature-strip.tsx`:

```typescript
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Lock, X } from 'lucide-react';
import { useUserStore } from '@/lib/stores';
import { track } from '@/lib/analytics';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const STORAGE_KEY = 'premium-feature-strip-dismissed';

const LOCKED_FEATURES = [
  'HD Export',
  'No Watermark',
  'Background Removal',
];

interface PremiumFeatureStripProps {
  className?: string;
}

export function PremiumFeatureStrip({ className }: PremiumFeatureStripProps): JSX.Element | null {
  const [isDismissed, setIsDismissed] = useState(false);
  const [hasTrackedView, setHasTrackedView] = useState(false);
  const subscriptionTier = useUserStore((state) => state.subscriptionTier);

  // Check localStorage on mount
  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY) === 'true';
    setIsDismissed(dismissed);
  }, []);

  // Track view once
  useEffect(() => {
    if (!isDismissed && subscriptionTier === 'free' && !hasTrackedView) {
      track('feature_teaser_viewed', { source: 'builder' });
      setHasTrackedView(true);
    }
  }, [isDismissed, subscriptionTier, hasTrackedView]);

  // Don't render for paid users
  if (subscriptionTier !== 'free') {
    return null;
  }

  // Don't render if dismissed
  if (isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    track('feature_teaser_dismissed', { source: 'builder' });
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsDismissed(true);
  };

  const handleCtaClick = () => {
    track('feature_teaser_clicked', { source: 'builder' });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        className={cn(
          'flex items-center justify-between gap-4 rounded-lg border border-surface-800 bg-surface-900/50 px-4 py-2.5',
          className
        )}
      >
        <div className="flex items-center gap-4 overflow-x-auto">
          {LOCKED_FEATURES.map((feature, index) => (
            <div
              key={feature}
              className="flex items-center gap-1.5 whitespace-nowrap text-xs text-surface-400"
            >
              <Lock className="h-3 w-3 text-surface-500" aria-hidden="true" />
              <span>{feature}</span>
              {index < LOCKED_FEATURES.length - 1 && (
                <span className="ml-2 text-surface-600" aria-hidden="true">·</span>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/pricing"
            onClick={handleCtaClick}
            className="text-xs font-medium text-gold-500 hover:text-gold-400 transition-colors whitespace-nowrap"
          >
            Unlock with Pro
            <span aria-hidden="true"> →</span>
          </Link>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss premium features banner"
            className="p-1 text-surface-500 hover:text-surface-300 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
```

**Step 4: Export from index**

Add to `apps/web/components/builder/index.ts`:

```typescript
export { PremiumFeatureStrip } from './premium-feature-strip';
```

**Step 5: Run tests to verify they pass**

```bash
pnpm test apps/web/components/builder/__tests__/premium-feature-strip.test.tsx
```
Expected: PASS

**Step 6: Commit**

```bash
git add apps/web/components/builder/premium-feature-strip.tsx apps/web/components/builder/__tests__/premium-feature-strip.test.tsx apps/web/components/builder/index.ts
git commit -m "feat(builder): add PremiumFeatureStrip component for free tier users"
```

---

## Task 5: Add Template Premium Badges

**Files:**
- Modify: `apps/web/components/builder/template-selector/template-card.tsx`
- Modify: `apps/web/components/builder/template-selector/template-selector.tsx`
- Modify: `apps/web/components/builder/template-selector/__tests__/template-card.test.tsx`

**Step 1: Write failing tests**

Add to `apps/web/components/builder/template-selector/__tests__/template-card.test.tsx`:

```typescript
describe('premium template badges', () => {
  const proTemplate: Template = {
    id: 'pro-1',
    name: 'Pro Template',
    category: 'championship',
    thumbnailUrl: '/pro.jpg',
    tier: 'pro',
  };

  const premiumTemplate: Template = {
    id: 'premium-1',
    name: 'Premium Template',
    category: 'championship',
    thumbnailUrl: '/premium.jpg',
    tier: 'premium',
  };

  beforeEach(() => {
    useUserStore.setState({ subscriptionTier: 'free' });
  });

  it('shows PRO badge on pro tier templates', () => {
    render(<TemplateCard template={proTemplate} isSelected={false} onSelect={jest.fn()} />);
    expect(screen.getByText('PRO')).toBeInTheDocument();
  });

  it('shows PREMIUM badge with crown on premium tier templates', () => {
    render(<TemplateCard template={premiumTemplate} isSelected={false} onSelect={jest.fn()} />);
    expect(screen.getByText('PREMIUM')).toBeInTheDocument();
    expect(screen.getByTestId('premium-crown-icon')).toBeInTheDocument();
  });

  it('shows upgrade modal when free user clicks pro template', async () => {
    const onSelect = jest.fn();
    render(<TemplateCard template={proTemplate} isSelected={false} onSelect={onSelect} />);

    await userEvent.click(screen.getByRole('button'));

    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.getByText(/upgrade to pro/i)).toBeInTheDocument();
  });

  it('allows pro user to select pro template normally', async () => {
    useUserStore.setState({ subscriptionTier: 'pro' });
    const onSelect = jest.fn();
    render(<TemplateCard template={proTemplate} isSelected={false} onSelect={onSelect} />);

    await userEvent.click(screen.getByRole('button'));

    expect(onSelect).toHaveBeenCalledWith('pro-1');
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
pnpm test apps/web/components/builder/template-selector/__tests__/template-card.test.tsx
```
Expected: FAIL

**Step 3: Update TemplateCard with tier badges**

Replace `apps/web/components/builder/template-selector/template-card.tsx`:

```typescript
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Check, ImageOff, Crown, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserStore } from '@/lib/stores';
import { UpgradePrompt } from '@/components/upgrade';
import { track } from '@/lib/analytics';
import type { Template } from '@/lib/types/api';

interface TemplateCardProps {
  template: Template;
  isSelected: boolean;
  onSelect: (templateId: string) => void;
  priority?: boolean;
}

type TemplateTier = 'free' | 'pro' | 'premium';

const TIER_HIERARCHY: Record<TemplateTier, number> = {
  free: 0,
  pro: 1,
  premium: 2,
};

function canAccessTemplate(userTier: TemplateTier, templateTier: TemplateTier): boolean {
  return TIER_HIERARCHY[userTier] >= TIER_HIERARCHY[templateTier];
}

export function TemplateCard({
  template,
  isSelected,
  onSelect,
  priority = false,
}: TemplateCardProps): JSX.Element {
  const [imageError, setImageError] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const subscriptionTier = useUserStore((state) => state.subscriptionTier);

  const templateTier = template.tier ?? 'free';
  const hasAccess = canAccessTemplate(subscriptionTier, templateTier);
  const isPremiumTemplate = templateTier !== 'free';

  const handleClick = () => {
    if (!hasAccess) {
      track('template_tier_upgrade_clicked', {
        template_id: template.id,
        template_tier: templateTier as 'pro' | 'premium',
      });
      setShowUpgradeModal(true);
      return;
    }
    onSelect(template.id);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          'group relative w-full rounded-xl text-left transition-all duration-300 ease-out-expo',
          'hover:scale-[1.02]',
          'focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:ring-offset-2 focus:ring-offset-surface-950',
          isSelected
            ? 'ring-2 ring-gold-500 shadow-lg shadow-gold-500/10'
            : 'ring-1 ring-surface-800 hover:ring-surface-700'
        )}
      >
        {/* Image container */}
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-t-xl bg-surface-800">
          {imageError ? (
            <div className="flex h-full w-full items-center justify-center bg-surface-800">
              <ImageOff className="h-8 w-8 text-surface-600" />
            </div>
          ) : (
            <>
              <Image
                src={template.thumbnailUrl}
                alt={template.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                priority={priority}
                onError={() => setImageError(true)}
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-surface-950/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              {/* Lock overlay for inaccessible templates */}
              {!hasAccess && (
                <div className="absolute inset-0 flex items-center justify-center bg-surface-950/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <Lock className="h-8 w-8 text-surface-300" />
                </div>
              )}
            </>
          )}

          {/* Tier badge - top left */}
          {isPremiumTemplate && (
            <div
              className={cn(
                'absolute left-2 top-2 flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                templateTier === 'premium'
                  ? 'bg-gold-500/20 text-gold-400 border border-gold-500/30'
                  : 'bg-gold-500/20 text-gold-400 border border-gold-500/30'
              )}
            >
              {templateTier === 'premium' && (
                <Crown data-testid="premium-crown-icon" className="h-2.5 w-2.5" />
              )}
              {templateTier.toUpperCase()}
            </div>
          )}

          {/* Selection indicator - top right */}
          {isSelected && (
            <div
              data-testid="checkmark-icon"
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-gold-500 shadow-lg shadow-gold-500/30"
            >
              <Check className="h-4 w-4 text-surface-950" strokeWidth={3} />
            </div>
          )}

          {/* Selected badge */}
          {isSelected && (
            <div className="absolute bottom-2 left-2 rounded-full bg-gold-500 px-2 py-0.5 text-xs font-medium text-surface-950">
              Selected
            </div>
          )}
        </div>

        {/* Info section */}
        <div
          className={cn(
            'rounded-b-xl border-t px-3 py-3 transition-colors duration-300',
            isSelected
              ? 'border-gold-500/30 bg-surface-900'
              : 'border-surface-800 bg-surface-900/50 group-hover:bg-surface-900'
          )}
        >
          <p className="text-sm font-medium text-white">{template.name}</p>
        </div>
      </button>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <UpgradePrompt
          variant="modal"
          targetTier={templateTier as 'pro' | 'premium'}
          source="template_selection"
          onDismiss={() => setShowUpgradeModal(false)}
        />
      )}
    </>
  );
}
```

**Step 4: Run tests to verify they pass**

```bash
pnpm test apps/web/components/builder/template-selector/__tests__/template-card.test.tsx
```
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/components/builder/template-selector/template-card.tsx apps/web/components/builder/template-selector/__tests__/template-card.test.tsx
git commit -m "feat(builder): add tier badges and upgrade modal to TemplateCard"
```

---

## Task 6: Create Output Quality Preview Card

**Files:**
- Create: `apps/web/components/builder/output-quality-card.tsx`
- Create: `apps/web/components/builder/__tests__/output-quality-card.test.tsx`
- Modify: `apps/web/components/builder/index.ts`

**Step 1: Write failing tests**

Create `apps/web/components/builder/__tests__/output-quality-card.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OutputQualityCard } from '../output-quality-card';
import { useUserStore } from '@/lib/stores';

describe('OutputQualityCard', () => {
  beforeEach(() => {
    useUserStore.setState({ subscriptionTier: 'free' });
  });

  it('renders for free tier users', () => {
    render(<OutputQualityCard />);

    expect(screen.getByText(/your poster/i)).toBeInTheDocument();
    expect(screen.getByText(/720p/i)).toBeInTheDocument();
    expect(screen.getByText(/watermarked/i)).toBeInTheDocument();
  });

  it('shows Pro and Premium upgrade options', () => {
    render(<OutputQualityCard />);

    expect(screen.getByText(/1080p HD/i)).toBeInTheDocument();
    expect(screen.getByText(/4K Ultra HD/i)).toBeInTheDocument();
  });

  it('has link to pricing page', () => {
    render(<OutputQualityCard />);

    expect(screen.getByRole('link', { name: /compare/i })).toHaveAttribute('href', '/pricing');
  });

  it('does not render for pro tier users', () => {
    useUserStore.setState({ subscriptionTier: 'pro' });
    render(<OutputQualityCard />);

    expect(screen.queryByText(/your poster/i)).not.toBeInTheDocument();
  });

  it('does not render for premium tier users', () => {
    useUserStore.setState({ subscriptionTier: 'premium' });
    render(<OutputQualityCard />);

    expect(screen.queryByText(/your poster/i)).not.toBeInTheDocument();
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
pnpm test apps/web/components/builder/__tests__/output-quality-card.test.tsx
```
Expected: FAIL (module not found)

**Step 3: Create the component**

Create `apps/web/components/builder/output-quality-card.tsx`:

```typescript
'use client';

import Link from 'next/link';
import { Zap, Crown } from 'lucide-react';
import { useUserStore } from '@/lib/stores';
import { track } from '@/lib/analytics';
import { cn } from '@/lib/utils';

interface OutputQualityCardProps {
  className?: string;
}

export function OutputQualityCard({ className }: OutputQualityCardProps): JSX.Element | null {
  const subscriptionTier = useUserStore((state) => state.subscriptionTier);

  // Only show for free tier users
  if (subscriptionTier !== 'free') {
    return null;
  }

  const handleCompareClick = () => {
    track('output_preview_compare_clicked', { current_tier: subscriptionTier });
  };

  return (
    <div
      className={cn(
        'rounded-lg border border-surface-800 bg-surface-900/30 p-4',
        className
      )}
    >
      {/* Current tier output */}
      <div className="mb-3">
        <p className="text-sm font-medium text-surface-300">Your poster</p>
        <p className="text-xs text-amber-500/80">720p · Watermarked</p>
      </div>

      {/* Divider */}
      <div className="border-t border-dashed border-surface-700 my-3" />

      {/* Upgrade options */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-surface-300">
          <Zap className="h-3.5 w-3.5 text-gold-500" aria-hidden="true" />
          <span>
            <span className="font-medium text-gold-400">Pro:</span> 1080p HD · No watermark
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-surface-300">
          <Crown className="h-3.5 w-3.5 text-gold-500" aria-hidden="true" />
          <span>
            <span className="font-medium text-gold-400">Premium:</span> 4K Ultra HD · Custom branding
          </span>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-4 text-right">
        <Link
          href="/pricing"
          onClick={handleCompareClick}
          className="text-sm font-medium text-gold-500 hover:text-gold-400 transition-colors"
        >
          Compare <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  );
}
```

**Step 4: Export from index**

Add to `apps/web/components/builder/index.ts`:

```typescript
export { OutputQualityCard } from './output-quality-card';
```

**Step 5: Run tests to verify they pass**

```bash
pnpm test apps/web/components/builder/__tests__/output-quality-card.test.tsx
```
Expected: PASS

**Step 6: Commit**

```bash
git add apps/web/components/builder/output-quality-card.tsx apps/web/components/builder/__tests__/output-quality-card.test.tsx apps/web/components/builder/index.ts
git commit -m "feat(builder): add OutputQualityCard showing tier comparison"
```

---

## Task 7: Create Contextual Banner Hook and Component

**Files:**
- Create: `apps/web/hooks/use-contextual-banners.ts`
- Create: `apps/web/hooks/__tests__/use-contextual-banners.test.ts`
- Modify: `apps/web/hooks/index.ts` (if exists, or create)

**Step 1: Write failing tests**

Create `apps/web/hooks/__tests__/use-contextual-banners.test.ts`:

```typescript
import { renderHook, act } from '@testing-library/react';
import { useContextualBanners } from '../use-contextual-banners';

describe('useContextualBanners', () => {
  it('returns showBanner as true for unseen banners', () => {
    const { result } = renderHook(() => useContextualBanners());

    expect(result.current.shouldShowBanner('photo_upload_banner')).toBe(true);
  });

  it('returns showBanner as false after dismissing', () => {
    const { result } = renderHook(() => useContextualBanners());

    act(() => {
      result.current.dismissBanner('photo_upload_banner');
    });

    expect(result.current.shouldShowBanner('photo_upload_banner')).toBe(false);
  });

  it('tracks multiple banners independently', () => {
    const { result } = renderHook(() => useContextualBanners());

    act(() => {
      result.current.dismissBanner('photo_upload_banner');
    });

    expect(result.current.shouldShowBanner('photo_upload_banner')).toBe(false);
    expect(result.current.shouldShowBanner('second_poster_banner')).toBe(true);
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
pnpm test apps/web/hooks/__tests__/use-contextual-banners.test.ts
```
Expected: FAIL

**Step 3: Create the hook**

Create `apps/web/hooks/use-contextual-banners.ts`:

```typescript
import { useState, useCallback } from 'react';

export type BannerId = 'photo_upload_banner' | 'second_poster_banner';

interface UseContextualBannersReturn {
  shouldShowBanner: (bannerId: BannerId) => boolean;
  dismissBanner: (bannerId: BannerId) => void;
}

export function useContextualBanners(): UseContextualBannersReturn {
  const [dismissedBanners, setDismissedBanners] = useState<Set<BannerId>>(new Set());

  const shouldShowBanner = useCallback(
    (bannerId: BannerId): boolean => {
      return !dismissedBanners.has(bannerId);
    },
    [dismissedBanners]
  );

  const dismissBanner = useCallback((bannerId: BannerId): void => {
    setDismissedBanners((prev) => new Set(prev).add(bannerId));
  }, []);

  return {
    shouldShowBanner,
    dismissBanner,
  };
}
```

**Step 4: Run tests to verify they pass**

```bash
pnpm test apps/web/hooks/__tests__/use-contextual-banners.test.ts
```
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/hooks/use-contextual-banners.ts apps/web/hooks/__tests__/use-contextual-banners.test.ts
git commit -m "feat(hooks): add useContextualBanners hook for session-scoped banners"
```

---

## Task 8: Add Photo Upload Success Banner

**Files:**
- Create: `apps/web/components/builder/photo-upload/photo-upload-banner.tsx`
- Modify: `apps/web/components/builder/photo-upload/photo-upload-zone.tsx`
- Modify: `apps/web/components/builder/photo-upload/index.ts`

**Step 1: Create the banner component**

Create `apps/web/components/builder/photo-upload/photo-upload-banner.tsx`:

```typescript
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserStore } from '@/lib/stores';
import { track } from '@/lib/analytics';
import { cn } from '@/lib/utils';

interface PhotoUploadBannerProps {
  show: boolean;
  onDismiss: () => void;
  className?: string;
}

const AUTO_DISMISS_MS = 8000;

export function PhotoUploadBanner({
  show,
  onDismiss,
  className,
}: PhotoUploadBannerProps): JSX.Element | null {
  const [hasTracked, setHasTracked] = useState(false);
  const subscriptionTier = useUserStore((state) => state.subscriptionTier);

  // Auto-dismiss after 8 seconds
  useEffect(() => {
    if (!show) return;

    const timer = setTimeout(() => {
      onDismiss();
    }, AUTO_DISMISS_MS);

    return () => clearTimeout(timer);
  }, [show, onDismiss]);

  // Track view once
  useEffect(() => {
    if (show && !hasTracked) {
      track('contextual_banner_viewed', {
        banner_id: 'photo_upload_banner',
        trigger: 'photo_upload_success',
      });
      setHasTracked(true);
    }
  }, [show, hasTracked]);

  // Only show for free tier
  if (subscriptionTier !== 'free' || !show) {
    return null;
  }

  const handleDismiss = () => {
    track('contextual_banner_dismissed', {
      banner_id: 'photo_upload_banner',
      trigger: 'photo_upload_success',
    });
    onDismiss();
  };

  const handleCtaClick = () => {
    track('contextual_banner_clicked', {
      banner_id: 'photo_upload_banner',
      trigger: 'photo_upload_success',
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        className={cn(
          'flex items-center justify-between gap-3 rounded-lg border border-gold-500/20 bg-gold-500/10 px-4 py-2.5',
          className
        )}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-gold-500" aria-hidden="true" />
          <p className="text-sm text-surface-200">
            Great shot!{' '}
            <Link
              href="/pricing"
              onClick={handleCtaClick}
              className="font-medium text-gold-400 hover:text-gold-300 underline underline-offset-2"
            >
              Pro users
            </Link>{' '}
            get automatic background removal.
          </p>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="p-1 text-surface-400 hover:text-surface-200 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
```

**Step 2: Update PhotoUploadZone to include banner**

Modify `apps/web/components/builder/photo-upload/photo-upload-zone.tsx`:

```typescript
'use client';

import { useCallback, useState } from 'react';
import { usePosterBuilderStore } from '@/lib/stores';
import { usePhotoUpload } from './use-photo-upload';
import { UploadDropzone } from './upload-dropzone';
import { ImageCropper } from './image-cropper';
import { PhotoUploadBanner } from './photo-upload-banner';
import { cn } from '@/lib/utils';

export interface PhotoUploadZoneProps {
  className?: string;
}

export function PhotoUploadZone({
  className,
}: PhotoUploadZoneProps): JSX.Element {
  const [showBanner, setShowBanner] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const setPhoto = usePosterBuilderStore((state) => state.setPhoto);
  const { preview, error, isLoading, handleFile, clear } = usePhotoUpload();

  const handleCropComplete = useCallback(
    (croppedFile: File): void => {
      setPhoto(croppedFile);
      // Show banner after successful crop (if not previously dismissed)
      if (!bannerDismissed) {
        setShowBanner(true);
      }
    },
    [setPhoto, bannerDismissed]
  );

  const handleRemove = useCallback((): void => {
    clear();
    setPhoto(null);
    setShowBanner(false);
  }, [clear, setPhoto]);

  const handleBannerDismiss = useCallback(() => {
    setShowBanner(false);
    setBannerDismissed(true);
  }, []);

  return (
    <div data-tour="photo-upload" className={cn('w-full space-y-3', className)}>
      {preview ? (
        <>
          <ImageCropper
            preview={preview}
            onCropComplete={handleCropComplete}
            onRemove={handleRemove}
          />
          <PhotoUploadBanner
            show={showBanner}
            onDismiss={handleBannerDismiss}
          />
        </>
      ) : (
        <UploadDropzone
          onFileSelect={handleFile}
          error={error}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}
```

**Step 3: Export from photo-upload index**

Add to `apps/web/components/builder/photo-upload/index.ts`:

```typescript
export { PhotoUploadBanner } from './photo-upload-banner';
```

**Step 4: Commit**

```bash
git add apps/web/components/builder/photo-upload/photo-upload-banner.tsx apps/web/components/builder/photo-upload/photo-upload-zone.tsx apps/web/components/builder/photo-upload/index.ts
git commit -m "feat(builder): add contextual banner after photo upload for free users"
```

---

## Task 9: Add Second Poster Dashboard Banner

**Files:**
- Create: `apps/web/components/dashboard/second-poster-banner.tsx`
- Modify: `apps/web/components/dashboard/welcome-section.tsx` (or dashboard page)

**Step 1: Create the banner component**

Create `apps/web/components/dashboard/second-poster-banner.tsx`:

```typescript
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { X, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserStore } from '@/lib/stores';
import { track } from '@/lib/analytics';
import { cn } from '@/lib/utils';

interface SecondPosterBannerProps {
  className?: string;
}

export function SecondPosterBanner({ className }: SecondPosterBannerProps): JSX.Element | null {
  const [isDismissed, setIsDismissed] = useState(false);
  const [hasTracked, setHasTracked] = useState(false);
  const subscriptionTier = useUserStore((state) => state.subscriptionTier);
  const postersThisMonth = useUserStore((state) => state.postersThisMonth);

  // Only show for free tier users who have created exactly 2 posters
  const shouldShow = subscriptionTier === 'free' && postersThisMonth === 2 && !isDismissed;

  // Track view once
  useEffect(() => {
    if (shouldShow && !hasTracked) {
      track('contextual_banner_viewed', {
        banner_id: 'second_poster_banner',
        trigger: 'second_poster_created',
      });
      setHasTracked(true);
    }
  }, [shouldShow, hasTracked]);

  if (!shouldShow) {
    return null;
  }

  const handleDismiss = () => {
    track('contextual_banner_dismissed', {
      banner_id: 'second_poster_banner',
      trigger: 'second_poster_created',
    });
    setIsDismissed(true);
  };

  const handleCtaClick = () => {
    track('contextual_banner_clicked', {
      banner_id: 'second_poster_banner',
      trigger: 'second_poster_created',
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        className={cn(
          'flex items-center justify-between gap-3 rounded-lg border border-gold-500/20 bg-gold-500/10 px-4 py-3',
          className
        )}
      >
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-gold-500" aria-hidden="true" />
          <p className="text-sm text-surface-200">
            You&apos;re on a roll!{' '}
            <Link
              href="/pricing"
              onClick={handleCtaClick}
              className="font-medium text-gold-400 hover:text-gold-300 underline underline-offset-2"
            >
              Upgrade for unlimited posters
            </Link>
          </p>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="p-1 text-surface-400 hover:text-surface-200 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
```

**Step 2: Export and add to dashboard**

Add to `apps/web/components/dashboard/index.ts`:

```typescript
export { SecondPosterBanner } from './second-poster-banner';
```

**Step 3: Commit**

```bash
git add apps/web/components/dashboard/second-poster-banner.tsx apps/web/components/dashboard/index.ts
git commit -m "feat(dashboard): add contextual banner for users who created 2 posters"
```

---

## Task 10: Integrate Components into Pages

**Files:**
- Modify: `apps/web/app/builder/page.tsx`
- Modify: `apps/web/components/builder/poster-builder-form/poster-builder-form.tsx`
- Modify: `apps/web/app/dashboard/page.tsx`

**Step 1: Add PremiumFeatureStrip to builder page**

Modify `apps/web/app/builder/page.tsx` - add import and component after page header, before form:

```typescript
import { PremiumFeatureStrip } from '@/components/builder';

// In the JSX, after the decorative line accent div and before the Form Container:
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.4, delay: 0.5 }}
  className="mb-8"
>
  <PremiumFeatureStrip />
</motion.div>
```

**Step 2: Add OutputQualityCard to poster-builder-form**

Modify `apps/web/components/builder/poster-builder-form/poster-builder-form.tsx` - add import and component above GenerateButton:

```typescript
import { OutputQualityCard } from '@/components/builder';

// In the JSX, above the Generate Button section:
{/* Output Quality Preview - Free tier only */}
<OutputQualityCard className="mb-4" />

{/* Generate Button - Sticky on mobile */}
<div
  data-testid="generate-button-wrapper"
  ...
```

**Step 3: Add SecondPosterBanner to dashboard page**

Modify `apps/web/app/dashboard/page.tsx` - add import and component after WelcomeSection:

```typescript
import { SecondPosterBanner } from '@/components/dashboard';

// In the JSX, after WelcomeSection, before Your Posters section:
<SecondPosterBanner className="mb-6" />
```

**Step 4: Run type check and lint**

```bash
pnpm type-check && pnpm lint
```
Expected: No errors

**Step 5: Commit**

```bash
git add apps/web/app/builder/page.tsx apps/web/components/builder/poster-builder-form/poster-builder-form.tsx apps/web/app/dashboard/page.tsx
git commit -m "feat(web): integrate premium upsell components into builder and dashboard"
```

---

## Task 11: Add Mock Pro Templates

**Files:**
- Modify: Template data source (mock data or API response)

**Step 1: Find and update template mock data**

Search for template mock data and add `tier: 'pro'` to 2-3 templates:

```typescript
// Example - add tier to templates 4 and 5
{
  id: 'template-4',
  name: 'Championship Gold',
  category: 'championship',
  thumbnailUrl: '/templates/championship-gold.jpg',
  tier: 'pro',
},
{
  id: 'template-5',
  name: 'Elite Fighter',
  category: 'competition',
  thumbnailUrl: '/templates/elite-fighter.jpg',
  tier: 'pro',
},
```

**Step 2: Commit**

```bash
git add <template-data-file>
git commit -m "feat(templates): mark select templates as pro tier"
```

---

## Task 12: Final Integration Test

**Step 1: Start dev server**

```bash
pnpm dev
```

**Step 2: Manual verification checklist**

- [ ] QuotaBadge shows upgrade tooltip at 50%+ usage
- [ ] QuotaBadge shows crown icon at 80%+ usage
- [ ] PremiumFeatureStrip appears for free users in builder
- [ ] PremiumFeatureStrip dismisses and stays dismissed
- [ ] Pro templates show "PRO" badge
- [ ] Clicking pro template shows upgrade modal
- [ ] OutputQualityCard appears above Generate button for free users
- [ ] Photo upload banner appears after cropping (free users)
- [ ] Photo upload banner auto-dismisses after 8 seconds
- [ ] Second poster banner appears on dashboard when postersThisMonth === 2

**Step 3: Run full test suite**

```bash
pnpm test
```
Expected: All tests pass

**Step 4: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix: address integration test feedback"
```

---

## Summary

| Task | Component | Status |
|------|-----------|--------|
| 1 | Template tier type | Pending |
| 2 | Analytics events | Pending |
| 3 | Enhanced QuotaBadge | Pending |
| 4 | PremiumFeatureStrip | Pending |
| 5 | TemplateCard tier badges | Pending |
| 6 | OutputQualityCard | Pending |
| 7 | useContextualBanners hook | Pending |
| 8 | PhotoUploadBanner | Pending |
| 9 | SecondPosterBanner | Pending |
| 10 | Page integrations | Pending |
| 11 | Mock pro templates | Pending |
| 12 | Final testing | Pending |

**Estimated commits:** 12
**New files:** 7
**Modified files:** 10
