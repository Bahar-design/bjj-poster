'use client';

import { useState, useCallback, useEffect } from 'react';
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
  const [hasSeenBefore, setHasSeenBefore] = useState(false);
  const router = useRouter();

  // Check localStorage on mount
  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    setHasSeenBefore(seen === 'true');
  }, []);

  const triggerCelebration = useCallback(
    (data: PosterData): void => {
      // Don't show if already seen
      if (hasSeenBefore || localStorage.getItem(STORAGE_KEY) === 'true') {
        return;
      }
      setPosterData(data);
      setShowCelebration(true);
    },
    [hasSeenBefore]
  );

  const markDownloaded = useCallback((): void => {
    setHasDownloaded(true);
  }, []);

  const dismiss = useCallback((): void => {
    localStorage.setItem(STORAGE_KEY, 'true');
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
