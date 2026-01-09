'use client';

import { Eye } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';

import { cn } from '@/lib/utils';
import { usePosterBuilderStore } from '@/lib/stores';

export function FloatingPreviewButton(): JSX.Element | null {
  const {
    athletePhoto,
    athleteName,
    beltRank,
    tournament,
    selectedTemplateId,
    togglePreview,
  } = usePosterBuilderStore(
    useShallow((state) => ({
      athletePhoto: state.athletePhoto,
      athleteName: state.athleteName,
      beltRank: state.beltRank,
      tournament: state.tournament,
      selectedTemplateId: state.selectedTemplateId,
      togglePreview: state.togglePreview,
    }))
  );

  // Check if any form data exists
  const hasAnyData = Boolean(
    athletePhoto ||
    athleteName.trim() ||
    tournament.trim() ||
    selectedTemplateId
  );

  // Check if all required fields are valid
  const isValid = Boolean(
    athletePhoto &&
    athleteName.trim() &&
    beltRank &&
    tournament.trim() &&
    selectedTemplateId
  );

  // Don't render if no data
  if (!hasAnyData) {
    return null;
  }

  return (
    <div className="fixed bottom-24 right-4 z-40 md:bottom-8 md:right-8">
      <button
        onClick={togglePreview}
        aria-label="Preview poster"
        className={cn(
          'group relative flex h-14 w-14 items-center justify-center rounded-full',
          'bg-surface-800 border border-surface-700',
          'shadow-xl shadow-black/30',
          'transition-all duration-300 ease-out-expo',
          'hover:scale-110 hover:border-gold-500/50 hover:shadow-gold-md',
          'focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:ring-offset-2 focus:ring-offset-surface-950',
          isValid && 'animate-pulse-gold border-gold-500/30'
        )}
      >
        {/* Glow effect when valid */}
        {isValid && (
          <div className="absolute inset-0 rounded-full bg-gold-500/20 blur-md" />
        )}

        <Eye
          data-testid="eye-icon"
          className={cn(
            'relative h-6 w-6 transition-colors',
            isValid ? 'text-gold-500' : 'text-surface-400 group-hover:text-white'
          )}
        />
      </button>
    </div>
  );
}
