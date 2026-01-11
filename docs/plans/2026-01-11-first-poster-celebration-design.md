# First Poster Celebration Design

**Issue:** ODE-80 - UI-ONB-003: First Poster Celebration
**Date:** 2026-01-11

## Overview

Show a celebration screen after a user creates their first poster, with download and sharing options.

## Component Structure

**Files to create:**
- `apps/web/components/onboarding/first-poster-celebration.tsx` - Main modal component
- `apps/web/components/onboarding/use-first-poster-celebration.ts` - State management hook

## Trigger Logic

```
GenerateButton click
    → generatePoster() API call
    → On success, BEFORE incrementUsage():
        → Check: postersThisMonth === 0?
        → If yes: Show FirstPosterCelebration with imageUrl
        → User downloads poster
        → "Go to Dashboard" becomes available
        → On dismiss: incrementUsage() + navigate to /dashboard
    → If no (not first poster):
        → incrementUsage()
        → Navigate to /dashboard or show standard success
```

## State Hook Interface

```typescript
interface UseFirstPosterCelebrationReturn {
  showCelebration: boolean;
  posterData: { imageUrl: string; posterId: string } | null;
  hasDownloaded: boolean;
  triggerCelebration: (data: { imageUrl: string; posterId: string }) => void;
  markDownloaded: () => void;
  dismiss: () => void;
}
```

localStorage key: `hasCreatedFirstPoster`

## Modal Layout

```
┌─────────────────────────────────────────┐
│              🎉 Congratulations! 🎉      │
│                                          │
│     You created your first tournament    │
│                  poster!                 │
│                                          │
│  ┌─────────────────────────────────┐    │
│  │                                 │    │
│  │      [Generated Poster]         │    │
│  │         (aspect 4:5)            │    │
│  │                                 │    │
│  └─────────────────────────────────┘    │
│                                          │
│   You have 1 poster left this month      │
│            (Free plan)                   │
│                                          │
│     ┌─────────────────────────────┐     │
│     │   📥 Download Poster        │     │
│     └─────────────────────────────┘     │
│                                          │
│      [Facebook]    [Share...]           │
│                                          │
│   Want unlimited posters? See Pro →     │
│                                          │
│          Go to Dashboard                │
└─────────────────────────────────────────┘
```

## Styling

- Full-screen overlay: `fixed inset-0 z-[100] bg-surface-950/95 backdrop-blur-sm`
- Modal card: `max-w-lg bg-surface-900 border-surface-700 rounded-2xl p-8`
- Header: `font-display text-3xl text-white`
- Poster image: `max-w-sm rounded-lg shadow-2xl border border-surface-700`
- Download button: `variant="premium"` with gold styling
- Quota text: `text-surface-400 text-sm`

## Interaction Behaviors

### Download Flow

1. User clicks "Download Poster"
2. Fetch image as blob (using existing PosterCard pattern)
3. Trigger browser download with filename: `{tournament-name}-poster.png`
4. Set `hasDownloaded: true` in hook state
5. Reveal "Go to Dashboard" button and social share options

### Social Sharing

```typescript
// Primary: Web Share API (mobile)
if (navigator.share && navigator.canShare) {
  await navigator.share({
    title: 'My Tournament Poster',
    text: 'Check out my BJJ tournament poster!',
    url: imageUrl
  });
}

// Fallback: Platform-specific
// Facebook: window.open(`https://facebook.com/sharer/sharer.php?u=${encodedUrl}`)
// Instagram: Show tooltip "Download and share from your camera roll"
```

### Modal Blocking

- Block escape key: `onEscapeKeyDown={(e) => e.preventDefault()}`
- Block backdrop click: `onPointerDownOutside={(e) => e.preventDefault()}`
- No X close button until download complete

### Dismiss Flow

1. User clicks "Go to Dashboard" (only visible after download)
2. Set localStorage `hasCreatedFirstPoster: 'true'`
3. Call `incrementUsage()` from user store
4. Navigate to `/dashboard`
5. Close modal

## Analytics Events

- `first_poster_celebration_viewed` - on modal open
- `first_poster_downloaded` - on download click
- `first_poster_shared` - on share action with `{ platform }`
- `first_poster_celebration_dismissed` - on go to dashboard

## Integration Points

### GenerateButton modification

```typescript
import { useFirstPosterCelebration } from '@/components/onboarding/use-first-poster-celebration';

const { triggerCelebration } = useFirstPosterCelebration();
const postersThisMonth = useUserStore((s) => s.postersThisMonth);

const handleGenerate = async () => {
  const result = await generatePoster();

  if (postersThisMonth === 0) {
    triggerCelebration({ imageUrl: result.imageUrl, posterId: result.posterId });
  } else {
    incrementUsage();
    router.push('/dashboard');
  }
};
```

### Render location

Add to `poster-builder-form.tsx` or page layout:

```typescript
import { FirstPosterCelebration } from '@/components/onboarding';

<FirstPosterCelebration />
```

### Export from onboarding index

```typescript
export { FirstPosterCelebration } from './first-poster-celebration';
export { useFirstPosterCelebration } from './use-first-poster-celebration';
```

## Edge Cases

1. **User refreshes during celebration** - Poster saved server-side, user can find it in dashboard
2. **Download fails** - Show error toast, keep download button enabled to retry, show "Go to Dashboard" after first attempt
3. **Already seen celebration** - Check localStorage on mount, never trigger if flag set
4. **Pro/Premium users** - Hide upsell section, still show quota reminder with their limits

## Test Cases

### Hook tests

- triggerCelebration sets showCelebration to true
- markDownloaded sets hasDownloaded to true
- dismiss sets localStorage and resets state
- doesn't trigger if localStorage flag already set

### Component tests

- renders celebration modal when showCelebration is true
- displays poster image from posterData
- download button triggers file download
- "Go to Dashboard" hidden until hasDownloaded
- "Go to Dashboard" visible after download
- upsell shown for free tier only
- quota reminder shows correct remaining count
- escape key doesn't close modal
- backdrop click doesn't close modal
