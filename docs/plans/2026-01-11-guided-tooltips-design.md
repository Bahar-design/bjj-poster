# Guided Tooltips in Builder - Design Document

**Issue:** ODE-79 - UI-ONB-002: Guided Tooltips in Builder
**Date:** 2026-01-11
**Status:** Approved

## Summary

Add sequential tooltips to guide first-time users through the poster creation flow in the builder.

## Approach

Using **React Joyride** library for the tooltip tour system. It handles spotlight effects, positioning, scrolling, and mobile support out of the box.

## Component Architecture

```
components/onboarding/
├── guided-tooltips.tsx       # Main tour component with Joyride
├── use-builder-tour.ts       # Hook managing tour state & localStorage
└── index.ts                  # Barrel export (update existing)
```

### GuidedTooltips Component
- Wraps `react-joyride` with Athletic Brutalism styling
- Receives target selectors for: photo upload, template selector, generate button
- Handles step progression, dismissal, and auto-advance (5 seconds)
- Renders conditionally based on `useBuilderTour` hook

### useBuilderTour Hook
- localStorage key: `"hasSeenBuilderTour"`
- Returns `{ showTour, isLoading, completeTour, skipTour }`
- Follows same pattern as existing `useWelcomeSplash` hook

### Integration
- Add `GuidedTooltips` to `poster-builder-form.tsx`
- Add `data-tour` attributes to target components for selector stability

## Tooltip Steps

| Step | Target Selector | Content |
|------|-----------------|---------|
| 1 | `[data-tour="photo-upload"]` | 👆 **Tap here to replace with your photo.** Take a photo or choose from library. |
| 2 | `[data-tour="template-selector"]` | 🎨 **Try different templates.** Swipe to see more styles. |
| 3 | `[data-tour="generate-button"]` | ⚡ **Tap to create your poster.** Takes about 15 seconds. |

### Behavior
- Auto-advance after 5 seconds OR user clicks "Next"
- "X" button dismisses entire tour immediately
- Clicking outside spotlight also dismisses
- Spotlight effect highlights target element
- After completing or dismissing → set `hasSeenBuilderTour: true`

### Positioning
- Steps 1 & 2: tooltip appears below target
- Step 3: tooltip appears above target (generate button is sticky at bottom)

## Pre-filled Sample Data

On first builder visit, pre-fill the form:

| Field | Pre-filled Value |
|-------|------------------|
| Photo | Generic BJJ athlete silhouette (`/images/sample-athlete.png`) |
| Athlete Name | "Your Name Here" |
| Belt Rank | "Black Belt" |
| Template | First template (index 0) |
| Tournament | "Your Tournament" |

### Implementation
- Add `initializeForFirstVisit()` method to `usePosterBuilderStore`
- Check `hasSeenBuilderTour` in localStorage on mount
- Only pre-fill if fields are empty (don't overwrite existing draft)

## Styling

Athletic Brutalism theme:
- Background: `surface-900` with `surface-700` border
- Text: Bold headings in white, body in `surface-300`
- Spotlight: `surface-950/80` overlay
- Buttons: Gold accent for "Next", subtle for "Skip"
- Border radius: `rounded-lg`
- Strong drop shadow

### Joyride Style Overrides
```tsx
const joyrideStyles = {
  options: {
    backgroundColor: 'var(--surface-900)',
    textColor: 'var(--surface-100)',
    primaryColor: 'var(--gold-500)',
    overlayColor: 'rgba(0, 0, 0, 0.85)',
    zIndex: 1000,
  },
  tooltip: {
    borderRadius: '8px',
    border: '1px solid var(--surface-700)',
  },
  buttonNext: {
    backgroundColor: 'var(--gold-500)',
    color: 'black',
    fontWeight: 'bold',
  },
  buttonSkip: {
    color: 'var(--surface-400)',
  },
}
```

### Mobile Considerations
- Large touch targets (min 44px)
- Tooltip max-width constrained to viewport
- Scroll into view before showing each step

## Edge Cases

- **SSR hydration:** Use `isLoading` state to prevent mismatch
- **Target not found:** Skip that step gracefully
- **User scrolls during tour:** Joyride handles scroll-to-target
- **Tour interrupted:** Tour state persists correctly
- **Draft exists:** Don't overwrite with sample data

## Test Cases

1. Tooltips appear on first builder visit
2. Tooltips advance sequentially (Next button)
3. Auto-advance after 5 seconds
4. "X" button dismisses all tooltips
5. Tooltips don't appear on subsequent visits
6. Sample data pre-fills correctly
7. Tooltip positioning works on mobile

## Files to Create/Modify

**New files:**
- `components/onboarding/guided-tooltips.tsx`
- `components/onboarding/use-builder-tour.ts`
- `components/onboarding/__tests__/guided-tooltips.test.tsx`
- `components/onboarding/__tests__/use-builder-tour.test.ts`
- `public/images/sample-athlete.png`

**Modified files:**
- `components/onboarding/index.ts` - Add exports
- `components/builder/poster-builder-form/poster-builder-form.tsx` - Integrate tour
- `components/builder/photo-upload/photo-upload-zone.tsx` - Add `data-tour` attr
- `components/builder/template-selector/template-selector.tsx` - Add `data-tour` attr
- `components/builder/poster-builder-form/generate-button.tsx` - Add `data-tour` attr
- `lib/stores/poster-builder-store.ts` - Add `initializeForFirstVisit()`
