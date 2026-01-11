# Guided Tooltips Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add sequential tooltips to guide first-time users through the poster builder flow.

**Architecture:** React Joyride library for tooltip tour, custom hook for localStorage state, data-tour attributes for stable selectors.

**Tech Stack:** React Joyride, Zustand, localStorage, Vitest, Testing Library

---

## Task 1: Install React Joyride

**Files:**
- Modify: `apps/web/package.json`

**Step 1: Install the package**

```bash
cd apps/web && pnpm add react-joyride
```

**Step 2: Verify installation**

Run: `cat apps/web/package.json | grep joyride`
Expected: `"react-joyride": "^2.x.x"`

**Step 3: Commit**

```bash
git add apps/web/package.json apps/web/pnpm-lock.yaml
git commit -m "deps(web): add react-joyride for guided tour"
```

---

## Task 2: Create useBuilderTour hook

**Files:**
- Create: `apps/web/components/onboarding/use-builder-tour.ts`
- Test: `apps/web/components/onboarding/__tests__/use-builder-tour.test.ts`

**Step 1: Write the failing tests**

Create `apps/web/components/onboarding/__tests__/use-builder-tour.test.ts`:

```typescript
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useBuilderTour } from '../use-builder-tour';

describe('useBuilderTour', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows tour when localStorage flag is not set', () => {
    const { result } = renderHook(() => useBuilderTour());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.showTour).toBe(true);
  });

  it('hides tour when localStorage flag is "true"', () => {
    localStorage.setItem('hasSeenBuilderTour', 'true');

    const { result } = renderHook(() => useBuilderTour());

    expect(result.current.showTour).toBe(false);
  });

  it('completeTour sets flag and hides tour', () => {
    const { result } = renderHook(() => useBuilderTour());

    act(() => {
      result.current.completeTour();
    });

    expect(localStorage.getItem('hasSeenBuilderTour')).toBe('true');
    expect(result.current.showTour).toBe(false);
  });

  it('skipTour sets flag and hides tour', () => {
    const { result } = renderHook(() => useBuilderTour());

    act(() => {
      result.current.skipTour();
    });

    expect(localStorage.getItem('hasSeenBuilderTour')).toBe('true');
    expect(result.current.showTour).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd apps/web && pnpm test use-builder-tour`
Expected: FAIL - Cannot find module '../use-builder-tour'

**Step 3: Write the hook implementation**

Create `apps/web/components/onboarding/use-builder-tour.ts`:

```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'hasSeenBuilderTour';

interface UseBuilderTourReturn {
  showTour: boolean;
  isLoading: boolean;
  completeTour: () => void;
  skipTour: () => void;
}

export function useBuilderTour(): UseBuilderTourReturn {
  const [showTour, setShowTour] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem(STORAGE_KEY);
    setShowTour(hasSeenTour !== 'true');
    setIsLoading(false);
  }, []);

  const completeTour = useCallback((): void => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setShowTour(false);
  }, []);

  const skipTour = useCallback((): void => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setShowTour(false);
  }, []);

  return { showTour, isLoading, completeTour, skipTour };
}
```

**Step 4: Run tests to verify they pass**

Run: `cd apps/web && pnpm test use-builder-tour`
Expected: 4 tests PASS

**Step 5: Commit**

```bash
git add apps/web/components/onboarding/use-builder-tour.ts apps/web/components/onboarding/__tests__/use-builder-tour.test.ts
git commit -m "feat(onboarding): add useBuilderTour hook with localStorage"
```

---

## Task 3: Create GuidedTooltips component

**Files:**
- Create: `apps/web/components/onboarding/guided-tooltips.tsx`
- Test: `apps/web/components/onboarding/__tests__/guided-tooltips.test.tsx`

**Step 1: Write the failing tests**

Create `apps/web/components/onboarding/__tests__/guided-tooltips.test.tsx`:

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GuidedTooltips } from '../guided-tooltips';

// Mock react-joyride to avoid actual tour rendering in tests
vi.mock('react-joyride', () => ({
  default: ({ callback, run, steps }: { callback: (data: { status: string }) => void; run: boolean; steps: unknown[] }) => {
    if (!run) return null;
    return (
      <div data-testid="joyride-mock">
        <span data-testid="step-count">{steps.length}</span>
        <button data-testid="skip-button" onClick={() => callback({ status: 'skipped' })}>
          Skip
        </button>
        <button data-testid="finish-button" onClick={() => callback({ status: 'finished' })}>
          Finish
        </button>
      </div>
    );
  },
  STATUS: {
    FINISHED: 'finished',
    SKIPPED: 'skipped',
  },
}));

describe('GuidedTooltips', () => {
  const mockOnComplete = vi.fn();
  const mockOnSkip = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when run is false', () => {
    render(<GuidedTooltips run={false} onComplete={mockOnComplete} onSkip={mockOnSkip} />);
    expect(screen.queryByTestId('joyride-mock')).not.toBeInTheDocument();
  });

  it('renders joyride when run is true', () => {
    render(<GuidedTooltips run={true} onComplete={mockOnComplete} onSkip={mockOnSkip} />);
    expect(screen.getByTestId('joyride-mock')).toBeInTheDocument();
  });

  it('has 3 tooltip steps', () => {
    render(<GuidedTooltips run={true} onComplete={mockOnComplete} onSkip={mockOnSkip} />);
    expect(screen.getByTestId('step-count')).toHaveTextContent('3');
  });

  it('calls onComplete when tour finishes', async () => {
    const user = userEvent.setup();
    render(<GuidedTooltips run={true} onComplete={mockOnComplete} onSkip={mockOnSkip} />);

    await user.click(screen.getByTestId('finish-button'));

    expect(mockOnComplete).toHaveBeenCalledTimes(1);
  });

  it('calls onSkip when tour is skipped', async () => {
    const user = userEvent.setup();
    render(<GuidedTooltips run={true} onComplete={mockOnComplete} onSkip={mockOnSkip} />);

    await user.click(screen.getByTestId('skip-button'));

    expect(mockOnSkip).toHaveBeenCalledTimes(1);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd apps/web && pnpm test guided-tooltips`
Expected: FAIL - Cannot find module '../guided-tooltips'

**Step 3: Write the component implementation**

Create `apps/web/components/onboarding/guided-tooltips.tsx`:

```tsx
'use client';

import { useCallback } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';

const TOUR_STEPS: Step[] = [
  {
    target: '[data-tour="photo-upload"]',
    content: (
      <div className="text-left">
        <p className="font-bold text-white mb-1">👆 Tap here to replace with your photo.</p>
        <p className="text-surface-300 text-sm">Take a photo or choose from library.</p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '[data-tour="template-selector"]',
    content: (
      <div className="text-left">
        <p className="font-bold text-white mb-1">🎨 Try different templates.</p>
        <p className="text-surface-300 text-sm">Swipe to see more styles.</p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '[data-tour="generate-button"]',
    content: (
      <div className="text-left">
        <p className="font-bold text-white mb-1">⚡ Tap to create your poster.</p>
        <p className="text-surface-300 text-sm">Takes about 15 seconds.</p>
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
  },
];

const JOYRIDE_STYLES = {
  options: {
    backgroundColor: '#1a1a1a',
    textColor: '#f5f5f5',
    primaryColor: '#d4af37',
    overlayColor: 'rgba(0, 0, 0, 0.85)',
    zIndex: 1000,
    arrowColor: '#1a1a1a',
  },
  tooltip: {
    borderRadius: 8,
    border: '1px solid #404040',
    padding: '16px',
  },
  tooltipContainer: {
    textAlign: 'left' as const,
  },
  buttonNext: {
    backgroundColor: '#d4af37',
    color: '#000000',
    fontWeight: 'bold',
    borderRadius: 6,
    padding: '8px 16px',
  },
  buttonBack: {
    color: '#a3a3a3',
    marginRight: 8,
  },
  buttonSkip: {
    color: '#a3a3a3',
  },
  buttonClose: {
    color: '#a3a3a3',
  },
  spotlight: {
    borderRadius: 8,
  },
};

interface GuidedTooltipsProps {
  run: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export function GuidedTooltips({ run, onComplete, onSkip }: GuidedTooltipsProps): JSX.Element | null {
  const handleCallback = useCallback(
    (data: CallBackProps) => {
      const { status } = data;

      if (status === STATUS.FINISHED) {
        onComplete();
      } else if (status === STATUS.SKIPPED) {
        onSkip();
      }
    },
    [onComplete, onSkip]
  );

  if (!run) {
    return null;
  }

  return (
    <Joyride
      steps={TOUR_STEPS}
      run={run}
      continuous
      showSkipButton
      showProgress
      scrollToFirstStep
      spotlightClicks
      disableOverlayClose={false}
      callback={handleCallback}
      styles={JOYRIDE_STYLES}
      locale={{
        back: 'Back',
        close: 'Close',
        last: 'Done',
        next: 'Next',
        skip: 'Skip tour',
      }}
      floaterProps={{
        hideArrow: false,
      }}
    />
  );
}
```

**Step 4: Run tests to verify they pass**

Run: `cd apps/web && pnpm test guided-tooltips`
Expected: 5 tests PASS

**Step 5: Commit**

```bash
git add apps/web/components/onboarding/guided-tooltips.tsx apps/web/components/onboarding/__tests__/guided-tooltips.test.tsx
git commit -m "feat(onboarding): add GuidedTooltips component with Joyride"
```

---

## Task 4: Update barrel exports

**Files:**
- Modify: `apps/web/components/onboarding/index.ts`

**Step 1: Update exports**

Edit `apps/web/components/onboarding/index.ts`:

```typescript
export { WelcomeSplash } from './welcome-splash';
export { useWelcomeSplash } from './use-welcome-splash';
export { GuidedTooltips } from './guided-tooltips';
export { useBuilderTour } from './use-builder-tour';
```

**Step 2: Verify exports work**

Run: `cd apps/web && pnpm type-check`
Expected: No errors

**Step 3: Commit**

```bash
git add apps/web/components/onboarding/index.ts
git commit -m "feat(onboarding): export GuidedTooltips and useBuilderTour"
```

---

## Task 5: Add data-tour attributes to target components

**Files:**
- Modify: `apps/web/components/builder/photo-upload/photo-upload-zone.tsx`
- Modify: `apps/web/components/builder/template-selector/template-selector.tsx`
- Modify: `apps/web/components/builder/poster-builder-form/generate-button.tsx`

**Step 1: Add data-tour to PhotoUploadZone**

In `apps/web/components/builder/photo-upload/photo-upload-zone.tsx`, change line 33:

```tsx
// FROM:
<div className={cn('w-full', className)}>

// TO:
<div data-tour="photo-upload" className={cn('w-full', className)}>
```

**Step 2: Add data-tour to TemplateSelector**

In `apps/web/components/builder/template-selector/template-selector.tsx`, change line 74:

```tsx
// FROM:
<div className="space-y-6">

// TO:
<div data-tour="template-selector" className="space-y-6">
```

**Step 3: Add data-tour to GenerateButton**

In `apps/web/components/builder/poster-builder-form/generate-button.tsx`, wrap the button at line 75:

```tsx
// FROM:
const button = (
  <Button

// TO:
const button = (
  <div data-tour="generate-button">
    <Button
```

And close the div after line 87:

```tsx
// FROM:
    </Button>
  );

// TO:
    </Button>
  </div>
);
```

**Step 4: Run type check**

Run: `cd apps/web && pnpm type-check`
Expected: No errors

**Step 5: Commit**

```bash
git add apps/web/components/builder/photo-upload/photo-upload-zone.tsx apps/web/components/builder/template-selector/template-selector.tsx apps/web/components/builder/poster-builder-form/generate-button.tsx
git commit -m "feat(builder): add data-tour attributes for guided tooltips"
```

---

## Task 6: Add initializeForFirstVisit to store

**Files:**
- Modify: `apps/web/lib/stores/poster-builder-store.ts`

**Step 1: Add action type and implementation**

In `apps/web/lib/stores/poster-builder-store.ts`:

Add to `PosterBuilderActions` interface (after line 103):

```typescript
  /**
   * Initializes the form with sample data for first-time visitors.
   * Only sets fields that are currently empty/default.
   */
  initializeForFirstVisit: () => void;
```

Add to the store implementation (after `loadFromPoster`, around line 214):

```typescript
        initializeForFirstVisit: () => {
          const state = get();
          // Only initialize if fields are still default/empty
          if (
            state.athleteName === '' &&
            state.beltRank === 'white' &&
            state.tournament === '' &&
            state.selectedTemplateId === null
          ) {
            set({
              athleteName: 'Your Name Here',
              beltRank: 'black',
              tournament: 'Your Tournament',
              selectedTemplateId: 'template-1', // Will be updated when templates load
            });
          }
        },
```

**Step 2: Run type check**

Run: `cd apps/web && pnpm type-check`
Expected: No errors

**Step 3: Commit**

```bash
git add apps/web/lib/stores/poster-builder-store.ts
git commit -m "feat(store): add initializeForFirstVisit for first-time users"
```

---

## Task 7: Integrate GuidedTooltips into PosterBuilderForm

**Files:**
- Modify: `apps/web/components/builder/poster-builder-form/poster-builder-form.tsx`

**Step 1: Add imports and hook usage**

In `apps/web/components/builder/poster-builder-form/poster-builder-form.tsx`:

Add imports at top:

```tsx
import { useEffect } from 'react';
import { GuidedTooltips, useBuilderTour } from '@/components/onboarding';
import { usePosterBuilderStore } from '@/lib/stores';
```

Add hook usage inside component (after line 13):

```tsx
export function PosterBuilderForm(): JSX.Element {
  const { showTour, isLoading, completeTour, skipTour } = useBuilderTour();
  const initializeForFirstVisit = usePosterBuilderStore(
    (state) => state.initializeForFirstVisit
  );

  // Initialize sample data for first-time visitors
  useEffect(() => {
    if (showTour && !isLoading) {
      initializeForFirstVisit();
    }
  }, [showTour, isLoading, initializeForFirstVisit]);
```

Add GuidedTooltips component before closing div (before line 53):

```tsx
      {/* Preview Modal */}
      <PreviewModal />

      {/* Guided Tour for First-Time Users */}
      {!isLoading && (
        <GuidedTooltips
          run={showTour}
          onComplete={completeTour}
          onSkip={skipTour}
        />
      )}
    </div>
```

**Step 2: Run type check**

Run: `cd apps/web && pnpm type-check`
Expected: No errors

**Step 3: Commit**

```bash
git add apps/web/components/builder/poster-builder-form/poster-builder-form.tsx
git commit -m "feat(builder): integrate GuidedTooltips for first-time users"
```

---

## Task 8: Add sample athlete silhouette image

**Files:**
- Create: `apps/web/public/images/sample-athlete.png`

**Step 1: Create placeholder image**

For now, we'll create a simple SVG placeholder that can be replaced with an actual silhouette later.

```bash
mkdir -p apps/web/public/images
```

Create a simple placeholder SVG converted to PNG (or use a placeholder service for now):

```bash
# Note: In production, replace with actual athlete silhouette
# For development, we can use a placeholder or skip the photo pre-fill
echo "Placeholder - replace with actual silhouette image" > apps/web/public/images/sample-athlete-placeholder.txt
```

**Step 2: Update initializeForFirstVisit to load sample photo (optional enhancement)**

This step is optional - the tour works without pre-filling the photo. The photo pre-fill would require fetching the image and converting to File, which adds complexity. For MVP, we skip photo pre-fill and let users upload their own.

**Step 3: Commit**

```bash
git add apps/web/public/images/sample-athlete-placeholder.txt
git commit -m "docs(builder): add placeholder for sample athlete image"
```

---

## Task 9: Run full test suite

**Step 1: Run all tests**

Run: `cd apps/web && pnpm test`
Expected: All tests PASS

**Step 2: Run type check**

Run: `cd apps/web && pnpm type-check`
Expected: No errors

**Step 3: Run lint**

Run: `cd apps/web && pnpm lint`
Expected: No errors (or only warnings)

---

## Task 10: Manual testing checklist

**Step 1: Start dev server**

Run: `pnpm dev`

**Step 2: Test first-time visitor flow**

1. Clear localStorage: `localStorage.clear()`
2. Navigate to `/builder`
3. Verify tooltips appear pointing to photo upload
4. Click "Next" - verify tooltip moves to template selector
5. Click "Next" - verify tooltip moves to generate button
6. Click "Done" - verify tour dismisses
7. Refresh page - verify tour does NOT appear again

**Step 3: Test skip functionality**

1. Clear localStorage: `localStorage.clear()`
2. Navigate to `/builder`
3. Click "Skip tour" on first tooltip
4. Verify all tooltips dismiss
5. Refresh page - verify tour does NOT appear again

**Step 4: Test sample data pre-fill**

1. Clear localStorage: `localStorage.clear()`
2. Navigate to `/builder`
3. Verify "Your Name Here" in athlete name field
4. Verify "Black Belt" selected
5. Verify "Your Tournament" in tournament field
6. Verify first template is selected

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Install react-joyride | package.json |
| 2 | Create useBuilderTour hook | use-builder-tour.ts, test |
| 3 | Create GuidedTooltips component | guided-tooltips.tsx, test |
| 4 | Update barrel exports | index.ts |
| 5 | Add data-tour attributes | 3 component files |
| 6 | Add initializeForFirstVisit | poster-builder-store.ts |
| 7 | Integrate into PosterBuilderForm | poster-builder-form.tsx |
| 8 | Add sample image placeholder | public/images/ |
| 9 | Run full test suite | - |
| 10 | Manual testing | - |
