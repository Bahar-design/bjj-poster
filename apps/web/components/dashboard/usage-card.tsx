'use client';

import { useShallow } from 'zustand/react/shallow';
import { useUserStore, UNLIMITED } from '@/lib/stores';
import { cn } from '@/lib/utils';

interface UsageCardProps {
  className?: string;
}

export function UsageCard({ className }: UsageCardProps): JSX.Element {
  const { postersThisMonth, postersLimit } = useUserStore(
    useShallow((state) => ({
      postersThisMonth: state.postersThisMonth,
      postersLimit: state.postersLimit,
    }))
  );

  const isUnlimited = postersLimit === UNLIMITED;
  const percentage = isUnlimited ? 0 : Math.min((postersThisMonth / postersLimit) * 100, 100);

  return (
    <div className={cn('rounded-xl border border-surface-800 bg-surface-900/50 p-6', className)}>
      <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-surface-800">
        <div
          data-testid="usage-progress"
          className="h-full rounded-full bg-emerald-500 transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
