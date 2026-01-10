# UpgradePrompt Component Design

**Issue:** ODE-75 - UI-SUB-001: Upgrade Prompt Component
**Date:** 2026-01-10
**Status:** Approved

## Summary

Create a reusable `UpgradePrompt` component for consistent upgrade CTAs throughout the app. Supports three display variants (banner, card, modal) with tier-specific benefits and analytics tracking.

## Architecture

```
apps/web/components/upgrade/
├── upgrade-prompt.tsx      # Main component with all 3 variants
├── upgrade-prompt.test.tsx # Tests
├── index.ts                # Barrel export
└── tier-benefits.ts        # Benefit data for Pro/Premium

apps/web/lib/
└── analytics.ts            # Stub analytics utility
```

### Props Interface

```typescript
interface UpgradePromptProps {
  variant: 'banner' | 'card' | 'modal'
  targetTier: 'pro' | 'premium'
  source: string              // Analytics tracking (e.g., "dashboard_header", "quota_limit")
  onDismiss?: () => void      // Optional - if provided, shows close button
}
```

## Visual Design

### Banner Variant (slim horizontal)
- Height: ~48px, full-width
- Layout: `[Sparkles icon] "Upgrade to {Tier} for {key benefit}" [Upgrade Now button] [X close]`
- Background: `bg-gold-500/10` with `border-gold-500/20` border
- Use case: Top of dashboard, above poster grid

### Card Variant (sidebar/inline)
- Width: fills container, ~300px typical
- Layout: Vertical stack
  - Header: `[Crown icon] Upgrade to {Tier}`
  - Benefits list (3-4 bullet points with checkmarks)
  - CTA button (full-width)
  - Close button (top-right corner)
- Background: Card style with gold accent border
- Use case: Sidebar, empty states, inline prompts

### Modal Variant (overlay)
- Centered dialog, max-width ~400px
- Uses shadcn `Dialog` component
- Same content as Card but larger, more prominent
- Use case: Quota limit blocking, feature gates

## Tier Benefits Content

| Pro | Premium |
|-----|---------|
| 20 posters/month | Unlimited posters |
| HD exports | 4K exports |
| No watermark | Priority support |
| Priority templates | Custom branding |

## Analytics

Stub analytics utility that logs to console in development:

```typescript
type AnalyticsEvent =
  | 'upgrade_prompt_viewed'
  | 'upgrade_prompt_clicked'
  | 'upgrade_prompt_dismissed'

interface EventProperties {
  source: string
  targetTier: 'pro' | 'premium'
  variant: 'banner' | 'card' | 'modal'
}

export function track(event: AnalyticsEvent, properties: EventProperties): void
```

**Event Triggers:**
- `upgrade_prompt_viewed` - fires on component mount
- `upgrade_prompt_clicked` - fires when CTA button clicked
- `upgrade_prompt_dismissed` - fires when close button clicked

## CTA Behavior

- Links to `/pricing` page using Next.js `Link` component
- Future: Can link directly to Stripe checkout when ODE-77 is complete

## Dismissal Behavior

- Dismissal is NOT persisted to localStorage
- Re-shows on page refresh
- Parent component controls visibility state
- Keeps component stateless and reusable

## Integration Points

- `UsageCard` - Can use banner variant to replace inline upgrade button
- `PosterGrid` - Card variant in empty states or sidebar
- `QuotaLimitModal` (ODE-76) - Will use modal variant internally
- Dashboard header - Banner variant when user is at 80%+ quota

## Test Approach

1. Test all three variants render correctly
2. Test Pro vs Premium shows different benefits
3. Test CTA button links to pricing page
4. Test close button calls onDismiss and is hidden when prop not provided
5. Test analytics events fire correctly
6. Verify component is reusable in multiple contexts
