import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useFirstPosterCelebration } from '../use-first-poster-celebration';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock user store
const mockIncrementUsage = vi.fn();
vi.mock('@/lib/stores/user-store', () => ({
  useUserStore: {
    getState: () => ({
      incrementUsage: mockIncrementUsage,
    }),
  },
}));

describe('useFirstPosterCelebration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('initializes with showCelebration false', () => {
    const { result } = renderHook(() => useFirstPosterCelebration());

    expect(result.current.showCelebration).toBe(false);
    expect(result.current.posterData).toBeNull();
    expect(result.current.hasDownloaded).toBe(false);
  });

  it('triggerCelebration sets showCelebration true and stores poster data', () => {
    const { result } = renderHook(() => useFirstPosterCelebration());
    const posterData = { imageUrl: '/test.png', posterId: '123' };

    act(() => {
      result.current.triggerCelebration(posterData);
    });

    expect(result.current.showCelebration).toBe(true);
    expect(result.current.posterData).toEqual(posterData);
  });

  it('does not trigger if localStorage flag already set', () => {
    localStorage.setItem('hasCreatedFirstPoster', 'true');
    const { result } = renderHook(() => useFirstPosterCelebration());
    const posterData = { imageUrl: '/test.png', posterId: '123' };

    act(() => {
      result.current.triggerCelebration(posterData);
    });

    expect(result.current.showCelebration).toBe(false);
  });

  it('markDownloaded sets hasDownloaded to true', () => {
    const { result } = renderHook(() => useFirstPosterCelebration());

    act(() => {
      result.current.triggerCelebration({ imageUrl: '/test.png', posterId: '123' });
    });

    act(() => {
      result.current.markDownloaded();
    });

    expect(result.current.hasDownloaded).toBe(true);
  });

  it('dismiss sets localStorage flag, resets state, increments usage, and navigates', () => {
    const { result } = renderHook(() => useFirstPosterCelebration());

    act(() => {
      result.current.triggerCelebration({ imageUrl: '/test.png', posterId: '123' });
    });

    act(() => {
      result.current.dismiss();
    });

    expect(localStorage.getItem('hasCreatedFirstPoster')).toBe('true');
    expect(result.current.showCelebration).toBe(false);
    expect(result.current.posterData).toBeNull();
    expect(mockIncrementUsage).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });
});
