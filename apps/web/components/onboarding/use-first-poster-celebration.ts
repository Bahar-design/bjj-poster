'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/lib/stores/user-store';

const STORAGE_KEY = 'hasCreatedFirstPoster';

export interface PosterData {
  imageUrl: string;
  posterId: string;
}

export interface UseFirstPosterCelebrationReturn {
  showCelebration: boolean;
  posterData: PosterData | null;
  hasDownloaded: boolean;
  triggerCelebration: (data: PosterData) => void;
  markDownloaded: () => void;
  dismiss: () => void;
}

export function useFirstPosterCelebration(): UseFirstPosterCelebrationReturn {
  const [showCelebration, setShowCelebration] = useState(false);
  const [posterData, setPosterData] = useState<PosterData | null>(null);
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const router = useRouter();

  // Ref to prevent race conditions with rapid triggers or multiple tabs
  const isShowingRef = useRef(false);

  const triggerCelebration = useCallback((data: PosterData): void => {
    // Single source of truth: always check localStorage directly
    // Also check ref to prevent duplicate triggers in same session
    if (isShowingRef.current || localStorage.getItem(STORAGE_KEY) === 'true') {
      return;
    }

    // Mark as showing before state update to prevent race conditions
    isShowingRef.current = true;
    setPosterData(data);
    setShowCelebration(true);
  }, []);

  const markDownloaded = useCallback((): void => {
    setHasDownloaded(true);
  }, []);

  const dismiss = useCallback((): void => {
    localStorage.setItem(STORAGE_KEY, 'true');
    isShowingRef.current = false;
    setShowCelebration(false);
    setPosterData(null);
    setHasDownloaded(false);
    useUserStore.getState().incrementUsage();
    router.push('/dashboard');
  }, [router]);

  return {
    showCelebration,
    posterData,
    hasDownloaded,
    triggerCelebration,
    markDownloaded,
    dismiss,
  };
}
