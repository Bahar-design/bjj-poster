# Poster Grid & Cards Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a responsive grid of poster cards with download, share, and duplicate actions for the dashboard.

**Architecture:** Component-first approach with TDD. Extend existing Poster type, create grid container with TanStack Query integration, individual card components with action handlers, and supporting empty/error/loading states.

**Tech Stack:** React 18, Next.js 14, TanStack Query, Zustand, Vitest, React Testing Library, Tailwind CSS, Lucide icons.

---

## Task 1: Extend Poster Type

**Files:**
- Modify: `apps/web/lib/types/api.ts:14-20`

**Step 1: Update Poster interface**

```typescript
/**
 * Poster entity from the API
 */
export interface Poster {
  id: string;
  templateId: string;
  createdAt: string;
  thumbnailUrl: string;
  title: string;
  athleteName: string;
  tournament: string;
  beltRank: string;
  status: 'draft' | 'completed';
}
```

**Step 2: Run type check**

Run: `pnpm type-check`
Expected: PASS (no consumers yet use new fields)

**Step 3: Commit**

```bash
git add apps/web/lib/types/api.ts
git commit -m "feat(types): extend Poster type with athlete fields (ODE-73)"
```

---

## Task 2: Update Mock Poster Data

**Files:**
- Modify: `apps/web/lib/api/posters.ts:3-20`

**Step 1: Update mock data with new fields**

```typescript
const MOCK_POSTERS: Record<string, Poster[]> = {
  'user-001': [
    {
      id: 'poster-001',
      templateId: 'tpl-001',
      createdAt: '2026-01-01T10:00:00Z',
      thumbnailUrl: '/posters/poster-001.png',
      title: 'Spring Championship 2026',
      athleteName: 'Marcus Silva',
      tournament: 'Spring Championship 2026',
      beltRank: 'Purple Belt',
      status: 'completed',
    },
    {
      id: 'poster-002',
      templateId: 'tpl-002',
      createdAt: '2026-01-03T14:30:00Z',
      thumbnailUrl: '/posters/poster-002.png',
      title: 'Kids Open Mat',
      athleteName: 'Sofia Chen',
      tournament: 'Kids Open Mat',
      beltRank: 'Blue Belt',
      status: 'completed',
    },
    {
      id: 'poster-003',
      templateId: 'tpl-001',
      createdAt: '2026-01-05T09:15:00Z',
      thumbnailUrl: '/posters/poster-003.png',
      title: 'Regional Qualifiers',
      athleteName: 'Jake Thompson',
      tournament: 'Regional Qualifiers',
      beltRank: 'Brown Belt',
      status: 'draft',
    },
  ],
};
```

**Step 2: Run type check**

Run: `pnpm type-check`
Expected: PASS

**Step 3: Commit**

```bash
git add apps/web/lib/api/posters.ts
git commit -m "feat(api): update mock posters with athlete fields (ODE-73)"
```

---

## Task 3: Add loadFromPoster to PosterBuilderStore

**Files:**
- Modify: `apps/web/lib/stores/poster-builder-store.ts`
- Test: `apps/web/lib/stores/__tests__/poster-builder-store.test.ts` (create)

**Step 1: Write failing test**

Create `apps/web/lib/stores/__tests__/poster-builder-store.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { usePosterBuilderStore } from '../poster-builder-store';

describe('PosterBuilderStore', () => {
  beforeEach(() => {
    usePosterBuilderStore.getState().reset();
  });

  describe('loadFromPoster', () => {
    it('loads poster data into form fields', () => {
      const posterData = {
        templateId: 'tpl-001',
        athleteName: 'Marcus Silva',
        tournament: 'Spring Championship',
        beltRank: 'purple' as const,
        team: 'Gracie Academy',
        date: '2026-03-15',
        location: 'Los Angeles, CA',
      };

      usePosterBuilderStore.getState().loadFromPoster(posterData);

      const state = usePosterBuilderStore.getState();
      expect(state.selectedTemplateId).toBe('tpl-001');
      expect(state.athleteName).toBe('Marcus Silva');
      expect(state.tournament).toBe('Spring Championship');
      expect(state.beltRank).toBe('purple');
      expect(state.team).toBe('Gracie Academy');
      expect(state.date).toBe('2026-03-15');
      expect(state.location).toBe('Los Angeles, CA');
    });

    it('handles partial data with defaults', () => {
      const posterData = {
        templateId: 'tpl-002',
        athleteName: 'Jake',
        tournament: 'Open Mat',
        beltRank: 'white' as const,
      };

      usePosterBuilderStore.getState().loadFromPoster(posterData);

      const state = usePosterBuilderStore.getState();
      expect(state.selectedTemplateId).toBe('tpl-002');
      expect(state.athleteName).toBe('Jake');
      expect(state.team).toBe('');
      expect(state.date).toBe('');
      expect(state.location).toBe('');
    });

    it('clears athletePhoto when loading', () => {
      // Set a photo first
      const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      usePosterBuilderStore.getState().setPhoto(mockFile);

      usePosterBuilderStore.getState().loadFromPoster({
        templateId: 'tpl-001',
        athleteName: 'Test',
        tournament: 'Test',
        beltRank: 'white',
      });

      expect(usePosterBuilderStore.getState().athletePhoto).toBeNull();
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test apps/web/lib/stores/__tests__/poster-builder-store.test.ts`
Expected: FAIL with "loadFromPoster is not a function"

**Step 3: Add LoadFromPosterData type and action interface**

In `apps/web/lib/stores/poster-builder-store.ts`, add after line 19:

```typescript
/** Data structure for loading a poster into the builder */
export interface LoadFromPosterData {
  templateId: string;
  athleteName: string;
  tournament: string;
  beltRank: BeltRank;
  team?: string;
  date?: string;
  location?: string;
}
```

Add to `PosterBuilderActions` interface after `generatePoster`:

```typescript
  /**
   * Loads poster data into the form for duplication.
   * Clears athletePhoto since it cannot be duplicated.
   */
  loadFromPoster: (data: LoadFromPosterData) => void;
```

**Step 4: Implement loadFromPoster action**

In the store implementation, add after the `generatePoster` action (before the closing of the persist):

```typescript
        loadFromPoster: (data) =>
          set({
            athletePhoto: null,
            athleteName: data.athleteName,
            beltRank: data.beltRank,
            team: data.team ?? '',
            tournament: data.tournament,
            date: data.date ?? '',
            location: data.location ?? '',
            selectedTemplateId: data.templateId,
            isGenerating: false,
            generationProgress: 0,
          }),
```

**Step 5: Run test to verify it passes**

Run: `pnpm test apps/web/lib/stores/__tests__/poster-builder-store.test.ts`
Expected: PASS

**Step 6: Commit**

```bash
git add apps/web/lib/stores/poster-builder-store.ts apps/web/lib/stores/__tests__/poster-builder-store.test.ts
git commit -m "feat(store): add loadFromPoster action for duplication (ODE-73)"
```

---

## Task 4: Create PosterCardSkeleton Component

**Files:**
- Create: `apps/web/components/dashboard/poster-grid/poster-card-skeleton.tsx`
- Test: `apps/web/components/dashboard/__tests__/poster-card-skeleton.test.tsx`

**Step 1: Write failing test**

Create `apps/web/components/dashboard/__tests__/poster-card-skeleton.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PosterCardSkeleton } from '../poster-grid/poster-card-skeleton';

describe('PosterCardSkeleton', () => {
  it('renders skeleton with pulse animation', () => {
    render(<PosterCardSkeleton />);

    const skeleton = screen.getByTestId('poster-card-skeleton');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveClass('animate-pulse');
  });

  it('has 3:4 aspect ratio thumbnail placeholder', () => {
    render(<PosterCardSkeleton />);

    const thumbnail = screen.getByTestId('skeleton-thumbnail');
    expect(thumbnail).toHaveClass('aspect-[3/4]');
  });

  it('has title and subtitle placeholders', () => {
    render(<PosterCardSkeleton />);

    expect(screen.getByTestId('skeleton-title')).toBeInTheDocument();
    expect(screen.getByTestId('skeleton-subtitle')).toBeInTheDocument();
  });

  it('has action button placeholders', () => {
    render(<PosterCardSkeleton />);

    const actions = screen.getByTestId('skeleton-actions');
    expect(actions.children).toHaveLength(3);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test apps/web/components/dashboard/__tests__/poster-card-skeleton.test.tsx`
Expected: FAIL with "Cannot find module"

**Step 3: Create poster-grid directory**

Run: `mkdir -p apps/web/components/dashboard/poster-grid`

**Step 4: Implement PosterCardSkeleton**

Create `apps/web/components/dashboard/poster-grid/poster-card-skeleton.tsx`:

```typescript
import { Card, CardContent } from '@/components/ui/card';

export function PosterCardSkeleton(): JSX.Element {
  return (
    <Card
      data-testid="poster-card-skeleton"
      className="animate-pulse overflow-hidden"
    >
      {/* Thumbnail skeleton */}
      <div
        data-testid="skeleton-thumbnail"
        className="aspect-[3/4] bg-surface-800"
      />

      <CardContent className="p-4">
        {/* Title skeleton */}
        <div
          data-testid="skeleton-title"
          className="mb-2 h-6 w-3/4 rounded bg-surface-800"
        />

        {/* Subtitle skeleton */}
        <div
          data-testid="skeleton-subtitle"
          className="mb-3 h-4 w-1/2 rounded bg-surface-800"
        />

        {/* Action buttons skeleton */}
        <div data-testid="skeleton-actions" className="flex gap-2">
          <div className="h-8 w-8 rounded bg-surface-800" />
          <div className="h-8 w-8 rounded bg-surface-800" />
          <div className="h-8 w-8 rounded bg-surface-800" />
        </div>
      </CardContent>
    </Card>
  );
}
```

**Step 5: Run test to verify it passes**

Run: `pnpm test apps/web/components/dashboard/__tests__/poster-card-skeleton.test.tsx`
Expected: PASS

**Step 6: Commit**

```bash
git add apps/web/components/dashboard/poster-grid/poster-card-skeleton.tsx apps/web/components/dashboard/__tests__/poster-card-skeleton.test.tsx
git commit -m "feat(dashboard): add PosterCardSkeleton component (ODE-73)"
```

---

## Task 5: Create PosterGridEmpty Component

**Files:**
- Create: `apps/web/components/dashboard/poster-grid/poster-grid-empty.tsx`
- Test: `apps/web/components/dashboard/__tests__/poster-grid-empty.test.tsx`

**Step 1: Write failing test**

Create `apps/web/components/dashboard/__tests__/poster-grid-empty.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PosterGridEmpty } from '../poster-grid/poster-grid-empty';

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('PosterGridEmpty', () => {
  it('renders empty state message', () => {
    render(<PosterGridEmpty />);

    expect(screen.getByText(/no posters yet/i)).toBeInTheDocument();
  });

  it('renders create poster button linking to builder', () => {
    render(<PosterGridEmpty />);

    const link = screen.getByRole('link', { name: /create poster/i });
    expect(link).toHaveAttribute('href', '/builder');
  });

  it('renders decorative icon', () => {
    render(<PosterGridEmpty />);

    expect(screen.getByTestId('empty-icon')).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test apps/web/components/dashboard/__tests__/poster-grid-empty.test.tsx`
Expected: FAIL with "Cannot find module"

**Step 3: Implement PosterGridEmpty**

Create `apps/web/components/dashboard/poster-grid/poster-grid-empty.tsx`:

```typescript
import Link from 'next/link';
import { FileImage } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PosterGridEmpty(): JSX.Element {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-surface-700 bg-surface-900/30 p-8">
      <FileImage
        data-testid="empty-icon"
        className="mb-4 h-16 w-16 text-surface-600"
        aria-hidden="true"
      />

      <h3 className="mb-2 font-display text-xl tracking-wide text-white">
        No posters yet
      </h3>

      <p className="mb-6 text-center text-sm text-surface-500">
        Create your first tournament poster!
      </p>

      <Button asChild>
        <Link href="/builder">Create Poster</Link>
      </Button>
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test apps/web/components/dashboard/__tests__/poster-grid-empty.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/components/dashboard/poster-grid/poster-grid-empty.tsx apps/web/components/dashboard/__tests__/poster-grid-empty.test.tsx
git commit -m "feat(dashboard): add PosterGridEmpty component (ODE-73)"
```

---

## Task 6: Create PosterGridError Component

**Files:**
- Create: `apps/web/components/dashboard/poster-grid/poster-grid-error.tsx`
- Test: `apps/web/components/dashboard/__tests__/poster-grid-error.test.tsx`

**Step 1: Write failing test**

Create `apps/web/components/dashboard/__tests__/poster-grid-error.test.tsx`:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PosterGridError } from '../poster-grid/poster-grid-error';

describe('PosterGridError', () => {
  it('renders error message', () => {
    render(<PosterGridError onRetry={() => {}} />);

    expect(screen.getByText(/couldn't load posters/i)).toBeInTheDocument();
  });

  it('renders retry button', () => {
    render(<PosterGridError onRetry={() => {}} />);

    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('calls onRetry when button clicked', () => {
    const onRetry = vi.fn();
    render(<PosterGridError onRetry={onRetry} />);

    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders warning icon', () => {
    render(<PosterGridError onRetry={() => {}} />);

    expect(screen.getByTestId('error-icon')).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test apps/web/components/dashboard/__tests__/poster-grid-error.test.tsx`
Expected: FAIL with "Cannot find module"

**Step 3: Implement PosterGridError**

Create `apps/web/components/dashboard/poster-grid/poster-grid-error.tsx`:

```typescript
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PosterGridErrorProps {
  onRetry: () => void;
}

export function PosterGridError({ onRetry }: PosterGridErrorProps): JSX.Element {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-surface-800 bg-surface-900/50 p-8">
      <AlertTriangle
        data-testid="error-icon"
        className="mb-4 h-16 w-16 text-amber-500"
        aria-hidden="true"
      />

      <h3 className="mb-2 font-display text-xl tracking-wide text-white">
        Couldn&apos;t load posters
      </h3>

      <p className="mb-6 text-center text-sm text-surface-500">
        Something went wrong. Please try again.
      </p>

      <Button variant="outline" onClick={onRetry}>
        Try Again
      </Button>
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test apps/web/components/dashboard/__tests__/poster-grid-error.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/components/dashboard/poster-grid/poster-grid-error.tsx apps/web/components/dashboard/__tests__/poster-grid-error.test.tsx
git commit -m "feat(dashboard): add PosterGridError component (ODE-73)"
```

---

## Task 7: Create ShareModal Component

**Files:**
- Create: `apps/web/components/dashboard/poster-grid/share-modal.tsx`
- Test: `apps/web/components/dashboard/__tests__/share-modal.test.tsx`

**Step 1: Write failing test**

Create `apps/web/components/dashboard/__tests__/share-modal.test.tsx`:

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ShareModal } from '../poster-grid/share-modal';

describe('ShareModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    posterUrl: 'https://example.com/posters/123',
    posterTitle: 'Spring Championship',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('renders when open', () => {
    render(<ShareModal {...defaultProps} />);

    expect(screen.getByText(/share poster/i)).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<ShareModal {...defaultProps} isOpen={false} />);

    expect(screen.queryByText(/share poster/i)).not.toBeInTheDocument();
  });

  it('renders all share buttons', () => {
    render(<ShareModal {...defaultProps} />);

    expect(screen.getByRole('button', { name: /copy link/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /instagram/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /facebook/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /twitter/i })).toBeInTheDocument();
  });

  it('copies link to clipboard and shows feedback', async () => {
    render(<ShareModal {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: /copy link/i }));

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      'https://example.com/posters/123'
    );

    await waitFor(() => {
      expect(screen.getByText(/copied/i)).toBeInTheDocument();
    });
  });

  it('calls onClose when close button clicked', () => {
    render(<ShareModal {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: /close/i }));

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop clicked', () => {
    render(<ShareModal {...defaultProps} />);

    fireEvent.click(screen.getByTestId('modal-backdrop'));

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('has correct Facebook share URL', () => {
    render(<ShareModal {...defaultProps} />);

    const fbLink = screen.getByRole('link', { name: /facebook/i });
    expect(fbLink).toHaveAttribute(
      'href',
      expect.stringContaining('facebook.com/sharer')
    );
  });

  it('has correct Twitter share URL', () => {
    render(<ShareModal {...defaultProps} />);

    const twitterLink = screen.getByRole('link', { name: /twitter/i });
    expect(twitterLink).toHaveAttribute(
      'href',
      expect.stringContaining('twitter.com/intent/tweet')
    );
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test apps/web/components/dashboard/__tests__/share-modal.test.tsx`
Expected: FAIL with "Cannot find module"

**Step 3: Implement ShareModal**

Create `apps/web/components/dashboard/poster-grid/share-modal.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { X, Link2, Instagram, Facebook, Twitter } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  posterUrl: string;
  posterTitle: string;
}

export function ShareModal({
  isOpen,
  onClose,
  posterUrl,
  posterTitle,
}: ShareModalProps): JSX.Element | null {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(posterUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareText = encodeURIComponent(`Check out my ${posterTitle} poster!`);
  const encodedUrl = encodeURIComponent(posterUrl);

  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
  const twitterUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${shareText}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        data-testid="modal-backdrop"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-sm rounded-xl border border-surface-700 bg-surface-900 p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-xl tracking-wide text-white">
            Share Poster
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Share buttons */}
        <div className="grid grid-cols-4 gap-3">
          {/* Copy Link */}
          <button
            onClick={handleCopyLink}
            className="flex flex-col items-center gap-2 rounded-lg p-3 transition-colors hover:bg-surface-800"
            aria-label="Copy link"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-800">
              <Link2 className="h-5 w-5 text-white" />
            </div>
            <span className="text-xs text-surface-400">
              {copied ? 'Copied!' : 'Copy'}
            </span>
          </button>

          {/* Instagram */}
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-2 rounded-lg p-3 transition-colors hover:bg-surface-800"
            aria-label="Instagram"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500">
              <Instagram className="h-5 w-5 text-white" />
            </div>
            <span className="text-xs text-surface-400">Instagram</span>
          </a>

          {/* Facebook */}
          <a
            href={facebookUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-2 rounded-lg p-3 transition-colors hover:bg-surface-800"
            aria-label="Facebook"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600">
              <Facebook className="h-5 w-5 text-white" />
            </div>
            <span className="text-xs text-surface-400">Facebook</span>
          </a>

          {/* Twitter/X */}
          <a
            href={twitterUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-2 rounded-lg p-3 transition-colors hover:bg-surface-800"
            aria-label="Twitter"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black">
              <Twitter className="h-5 w-5 text-white" />
            </div>
            <span className="text-xs text-surface-400">X</span>
          </a>
        </div>
      </div>
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test apps/web/components/dashboard/__tests__/share-modal.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/components/dashboard/poster-grid/share-modal.tsx apps/web/components/dashboard/__tests__/share-modal.test.tsx
git commit -m "feat(dashboard): add ShareModal component (ODE-73)"
```

---

## Task 8: Create PosterCard Component

**Files:**
- Create: `apps/web/components/dashboard/poster-grid/poster-card.tsx`
- Test: `apps/web/components/dashboard/__tests__/poster-card.test.tsx`

**Step 1: Write failing test**

Create `apps/web/components/dashboard/__tests__/poster-card.test.tsx`:

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PosterCard } from '../poster-grid/poster-card';
import type { Poster } from '@/lib/types/api';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string }) => (
    <img src={src} alt={alt} {...props} />
  ),
}));

// Mock poster builder store
const mockLoadFromPoster = vi.fn();
vi.mock('@/lib/stores/poster-builder-store', () => ({
  usePosterBuilderStore: {
    getState: () => ({
      loadFromPoster: mockLoadFromPoster,
    }),
  },
}));

describe('PosterCard', () => {
  const mockPoster: Poster = {
    id: 'poster-001',
    templateId: 'tpl-001',
    createdAt: '2026-01-01T10:00:00Z',
    thumbnailUrl: '/posters/poster-001.png',
    title: 'Spring Championship 2026',
    athleteName: 'Marcus Silva',
    tournament: 'Spring Championship 2026',
    beltRank: 'Purple Belt',
    status: 'completed',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock fetch for download
    global.fetch = vi.fn().mockResolvedValue({
      blob: () => Promise.resolve(new Blob([''], { type: 'image/png' })),
    });
    // Mock URL methods
    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:test');
    global.URL.revokeObjectURL = vi.fn();
  });

  it('renders poster thumbnail', () => {
    render(<PosterCard poster={mockPoster} />);

    const img = screen.getByRole('img', { name: mockPoster.tournament });
    expect(img).toHaveAttribute('src', mockPoster.thumbnailUrl);
  });

  it('renders tournament title', () => {
    render(<PosterCard poster={mockPoster} />);

    expect(screen.getByText(mockPoster.tournament)).toBeInTheDocument();
  });

  it('renders belt rank and formatted date', () => {
    render(<PosterCard poster={mockPoster} />);

    expect(screen.getByText(/purple belt/i)).toBeInTheDocument();
    expect(screen.getByText(/jan 1, 2026/i)).toBeInTheDocument();
  });

  it('renders download button', () => {
    render(<PosterCard poster={mockPoster} />);

    expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument();
  });

  it('renders share button', () => {
    render(<PosterCard poster={mockPoster} />);

    expect(screen.getByRole('button', { name: /share/i })).toBeInTheDocument();
  });

  it('renders duplicate button', () => {
    render(<PosterCard poster={mockPoster} />);

    expect(screen.getByRole('button', { name: /duplicate/i })).toBeInTheDocument();
  });

  it('triggers download on download button click', async () => {
    render(<PosterCard poster={mockPoster} />);

    fireEvent.click(screen.getByRole('button', { name: /download/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(mockPoster.thumbnailUrl);
    });
  });

  it('opens share modal on share button click', () => {
    render(<PosterCard poster={mockPoster} />);

    fireEvent.click(screen.getByRole('button', { name: /share/i }));

    expect(screen.getByText(/share poster/i)).toBeInTheDocument();
  });

  it('duplicates to builder on duplicate button click', () => {
    render(<PosterCard poster={mockPoster} />);

    fireEvent.click(screen.getByRole('button', { name: /duplicate/i }));

    expect(mockLoadFromPoster).toHaveBeenCalledWith({
      templateId: mockPoster.templateId,
      athleteName: mockPoster.athleteName,
      tournament: mockPoster.tournament,
      beltRank: 'purple',
    });
    expect(mockPush).toHaveBeenCalledWith('/builder');
  });

  it('shows placeholder when thumbnail fails to load', () => {
    render(<PosterCard poster={{ ...mockPoster, thumbnailUrl: '' }} />);

    expect(screen.getByTestId('thumbnail-placeholder')).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test apps/web/components/dashboard/__tests__/poster-card.test.tsx`
Expected: FAIL with "Cannot find module"

**Step 3: Implement PosterCard**

Create `apps/web/components/dashboard/poster-grid/poster-card.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Download, Share2, Copy, ImageIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShareModal } from './share-modal';
import { usePosterBuilderStore } from '@/lib/stores/poster-builder-store';
import type { Poster } from '@/lib/types/api';
import type { BeltRank } from '@/lib/stores/poster-builder-store';

interface PosterCardProps {
  poster: Poster;
}

/**
 * Converts display belt rank to store belt rank format
 */
function toBeltRank(displayRank: string): BeltRank {
  const normalized = displayRank.toLowerCase().replace(' belt', '');
  const validRanks: BeltRank[] = ['white', 'blue', 'purple', 'brown', 'black', 'red-black', 'red'];
  return validRanks.includes(normalized as BeltRank) ? (normalized as BeltRank) : 'white';
}

/**
 * Formats ISO date string to readable format
 */
function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function PosterCard({ poster }: PosterCardProps): JSX.Element {
  const router = useRouter();
  const [shareOpen, setShareOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleDownload = async () => {
    try {
      const response = await fetch(poster.thumbnailUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `${poster.tournament.replace(/\s+/g, '-').toLowerCase()}-poster.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleDuplicate = () => {
    usePosterBuilderStore.getState().loadFromPoster({
      templateId: poster.templateId,
      athleteName: poster.athleteName,
      tournament: poster.tournament,
      beltRank: toBeltRank(poster.beltRank),
    });
    router.push('/builder');
  };

  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/posters/${poster.id}`;

  return (
    <>
      <Card className="group overflow-hidden transition-all duration-300 hover:border-gold-500/30 hover:shadow-gold-500/10">
        {/* Thumbnail */}
        <div className="relative aspect-[3/4] bg-surface-800">
          {poster.thumbnailUrl && !imageError ? (
            <Image
              src={poster.thumbnailUrl}
              alt={poster.tournament}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              onError={() => setImageError(true)}
            />
          ) : (
            <div
              data-testid="thumbnail-placeholder"
              className="flex h-full items-center justify-center"
            >
              <ImageIcon className="h-12 w-12 text-surface-600" />
            </div>
          )}
        </div>

        <CardContent className="p-4">
          {/* Title */}
          <h3 className="mb-1 truncate font-display text-lg tracking-wide text-white">
            {poster.tournament}
          </h3>

          {/* Subtitle */}
          <p className="mb-3 text-sm text-surface-400">
            {poster.beltRank} &bull; {formatDate(poster.createdAt)}
          </p>

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDownload}
              aria-label="Download"
              title="Download"
              className="h-8 w-8"
            >
              <Download className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShareOpen(true)}
              aria-label="Share"
              title="Share"
              className="h-8 w-8"
            >
              <Share2 className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleDuplicate}
              aria-label="Duplicate"
              title="Duplicate to builder"
              className="h-8 w-8"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <ShareModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        posterUrl={shareUrl}
        posterTitle={poster.tournament}
      />
    </>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test apps/web/components/dashboard/__tests__/poster-card.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/components/dashboard/poster-grid/poster-card.tsx apps/web/components/dashboard/__tests__/poster-card.test.tsx
git commit -m "feat(dashboard): add PosterCard component with actions (ODE-73)"
```

---

## Task 9: Create PosterGrid Container Component

**Files:**
- Create: `apps/web/components/dashboard/poster-grid/poster-grid.tsx`
- Test: `apps/web/components/dashboard/__tests__/poster-grid.test.tsx`

**Step 1: Write failing test**

Create `apps/web/components/dashboard/__tests__/poster-grid.test.tsx`:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PosterGrid } from '../poster-grid/poster-grid';

// Mock the hooks
const mockUsePosterHistory = vi.fn();
vi.mock('@/lib/hooks', () => ({
  usePosterHistory: () => mockUsePosterHistory(),
}));

// Mock user store
vi.mock('@/lib/stores', () => ({
  useUserStore: (selector: (state: { user: { id: string } | null }) => unknown) =>
    selector({ user: { id: 'user-001' } }),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock poster builder store
vi.mock('@/lib/stores/poster-builder-store', () => ({
  usePosterBuilderStore: {
    getState: () => ({
      loadFromPoster: vi.fn(),
    }),
  },
}));

describe('PosterGrid', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading skeletons when loading', () => {
    mockUsePosterHistory.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    });

    render(<PosterGrid />);

    const skeletons = screen.getAllByTestId('poster-card-skeleton');
    expect(skeletons).toHaveLength(6);
  });

  it('renders error state on error', () => {
    mockUsePosterHistory.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
    });

    render(<PosterGrid />);

    expect(screen.getByText(/couldn't load posters/i)).toBeInTheDocument();
  });

  it('calls refetch when retry clicked', () => {
    const refetch = vi.fn();
    mockUsePosterHistory.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch,
    });

    render(<PosterGrid />);

    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('renders empty state when no posters', () => {
    mockUsePosterHistory.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<PosterGrid />);

    expect(screen.getByText(/no posters yet/i)).toBeInTheDocument();
  });

  it('renders poster cards when data available', () => {
    mockUsePosterHistory.mockReturnValue({
      data: [
        {
          id: 'poster-001',
          templateId: 'tpl-001',
          createdAt: '2026-01-01T10:00:00Z',
          thumbnailUrl: '/posters/poster-001.png',
          title: 'Spring Championship',
          athleteName: 'Marcus Silva',
          tournament: 'Spring Championship',
          beltRank: 'Purple Belt',
          status: 'completed',
        },
        {
          id: 'poster-002',
          templateId: 'tpl-002',
          createdAt: '2026-01-02T10:00:00Z',
          thumbnailUrl: '/posters/poster-002.png',
          title: 'Kids Open Mat',
          athleteName: 'Sofia Chen',
          tournament: 'Kids Open Mat',
          beltRank: 'Blue Belt',
          status: 'completed',
        },
      ],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<PosterGrid />);

    expect(screen.getByText('Spring Championship')).toBeInTheDocument();
    expect(screen.getByText('Kids Open Mat')).toBeInTheDocument();
  });

  it('renders grid with responsive columns', () => {
    mockUsePosterHistory.mockReturnValue({
      data: [
        {
          id: 'poster-001',
          templateId: 'tpl-001',
          createdAt: '2026-01-01T10:00:00Z',
          thumbnailUrl: '/posters/poster-001.png',
          title: 'Test',
          athleteName: 'Test',
          tournament: 'Test',
          beltRank: 'White Belt',
          status: 'completed',
        },
      ],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<PosterGrid />);

    const grid = screen.getByTestId('poster-grid');
    expect(grid).toHaveClass('grid');
    expect(grid).toHaveClass('sm:grid-cols-2');
    expect(grid).toHaveClass('lg:grid-cols-3');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test apps/web/components/dashboard/__tests__/poster-grid.test.tsx`
Expected: FAIL with "Cannot find module"

**Step 3: Implement PosterGrid**

Create `apps/web/components/dashboard/poster-grid/poster-grid.tsx`:

```typescript
'use client';

import { usePosterHistory } from '@/lib/hooks';
import { useUserStore } from '@/lib/stores';
import { PosterCard } from './poster-card';
import { PosterCardSkeleton } from './poster-card-skeleton';
import { PosterGridEmpty } from './poster-grid-empty';
import { PosterGridError } from './poster-grid-error';

export function PosterGrid(): JSX.Element {
  const user = useUserStore((state) => state.user);
  const { data: posters, isLoading, isError, refetch } = usePosterHistory(user?.id);

  if (isLoading) {
    return (
      <div
        data-testid="poster-grid"
        className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <PosterCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError) {
    return <PosterGridError onRetry={refetch} />;
  }

  if (!posters?.length) {
    return <PosterGridEmpty />;
  }

  return (
    <div
      data-testid="poster-grid"
      className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
    >
      {posters.map((poster) => (
        <PosterCard key={poster.id} poster={poster} />
      ))}
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test apps/web/components/dashboard/__tests__/poster-grid.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/components/dashboard/poster-grid/poster-grid.tsx apps/web/components/dashboard/__tests__/poster-grid.test.tsx
git commit -m "feat(dashboard): add PosterGrid container component (ODE-73)"
```

---

## Task 10: Create Barrel Export and Update Dashboard Index

**Files:**
- Create: `apps/web/components/dashboard/poster-grid/index.ts`
- Modify: `apps/web/components/dashboard/index.ts`

**Step 1: Create barrel export for poster-grid**

Create `apps/web/components/dashboard/poster-grid/index.ts`:

```typescript
export { PosterGrid } from './poster-grid';
export { PosterCard } from './poster-card';
export { PosterCardSkeleton } from './poster-card-skeleton';
export { PosterGridEmpty } from './poster-grid-empty';
export { PosterGridError } from './poster-grid-error';
export { ShareModal } from './share-modal';
```

**Step 2: Update dashboard index**

Update `apps/web/components/dashboard/index.ts`:

```typescript
export { CreateNewCard } from './create-new-card';
export { DashboardHeader } from './dashboard-header';
export { UsageCard } from './usage-card';
export { WelcomeSection } from './welcome-section';
export {
  PosterGrid,
  PosterCard,
  PosterCardSkeleton,
  PosterGridEmpty,
  PosterGridError,
  ShareModal,
} from './poster-grid';
```

**Step 3: Run type check**

Run: `pnpm type-check`
Expected: PASS

**Step 4: Commit**

```bash
git add apps/web/components/dashboard/poster-grid/index.ts apps/web/components/dashboard/index.ts
git commit -m "feat(dashboard): export PosterGrid components (ODE-73)"
```

---

## Task 11: Final Integration Test and Quality Check

**Step 1: Run all tests**

Run: `pnpm test`
Expected: ALL PASS

**Step 2: Run linter**

Run: `pnpm lint`
Expected: No errors

**Step 3: Run type check**

Run: `pnpm type-check`
Expected: No errors

**Step 4: Verify dev server works**

Run: `pnpm dev`
Navigate to dashboard, verify PosterGrid renders.

---

## Summary

| Task | Component | Test File |
|------|-----------|-----------|
| 1 | Poster type extension | - |
| 2 | Mock data update | - |
| 3 | loadFromPoster action | poster-builder-store.test.ts |
| 4 | PosterCardSkeleton | poster-card-skeleton.test.tsx |
| 5 | PosterGridEmpty | poster-grid-empty.test.tsx |
| 6 | PosterGridError | poster-grid-error.test.tsx |
| 7 | ShareModal | share-modal.test.tsx |
| 8 | PosterCard | poster-card.test.tsx |
| 9 | PosterGrid | poster-grid.test.tsx |
| 10 | Exports | - |
| 11 | Integration | - |

**Total estimated tasks:** 11
**Test files to create:** 7
**Components to create:** 6
