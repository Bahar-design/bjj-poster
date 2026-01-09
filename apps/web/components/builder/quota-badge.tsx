'use client';

import { useUserStore } from '@/lib/stores';
import { cn } from '@/lib/utils';

interface QuotaBadgeProps {
  className?: string;
}

export function QuotaBadge({ className }: QuotaBadgeProps): JSX.Element {
  const postersThisMonth = useUserStore((state) => state.postersThisMonth);
  const postersLimit = useUserStore((state) => state.postersLimit);

  const percentage = postersLimit > 0 ? (postersThisMonth / postersLimit) * 100 : 0;

  const dotColor =
    percentage < 50
      ? 'bg-emerald-500 shadow-emerald-500/50'
      : percentage < 80
        ? 'bg-amber-500 shadow-amber-500/50'
        : 'bg-red-500 shadow-red-500/50';

  return (
    <div
      className={cn(
        'flex items-center gap-2.5 rounded-full border border-surface-800 bg-surface-900/50 px-3 py-1.5',
        className
      )}
    >
      <div
        data-testid="quota-dot"
        className={cn('h-2 w-2 rounded-full shadow-sm', dotColor)}
      />
      <span className="text-sm text-surface-400">
        <span className="font-semibold text-white">{postersThisMonth}</span>
        <span className="mx-1 text-surface-600">/</span>
        <span className="font-semibold text-white">{postersLimit}</span>
        <span className="ml-1 text-surface-500">used</span>
      </span>
    </div>
  );
}
