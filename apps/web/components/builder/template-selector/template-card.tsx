'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Check, ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Template } from '@/lib/types/api';

interface TemplateCardProps {
  template: Template;
  isSelected: boolean;
  onSelect: (templateId: string) => void;
  /** Use priority loading for above-the-fold images (recommended section) */
  priority?: boolean;
}

export function TemplateCard({
  template,
  isSelected,
  onSelect,
  priority = false,
}: TemplateCardProps): JSX.Element {
  const [imageError, setImageError] = useState(false);

  return (
    <button
      type="button"
      onClick={() => onSelect(template.id)}
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
          </>
        )}

        {/* Selection indicator */}
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
  );
}
