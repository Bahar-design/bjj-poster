'use client';

import { useShallow } from 'zustand/react/shallow';
import { useUserStore, UNLIMITED } from '@/lib/stores';
import { UsageCard } from './usage-card';

export function WelcomeSection(): JSX.Element {
  const { user, postersThisMonth, postersLimit } = useUserStore(
    useShallow((state) => ({
      user: state.user,
      postersThisMonth: state.postersThisMonth,
      postersLimit: state.postersLimit,
    }))
  );

  const isUnlimited = postersLimit === UNLIMITED;
  const isAtLimit = !isUnlimited && postersThisMonth >= postersLimit;
  const userName = user?.name?.split(' ')[0] || '';

  return (
    <section className="mb-8">
      {/* Welcome Header */}
      <div className="mb-6">
        <h1 className="font-display text-4xl tracking-wide text-white md:text-5xl">
          WELCOME BACK{userName ? `, ${userName.toUpperCase()}` : ''}
        </h1>
        <p className="mt-2 text-surface-400">
          {isAtLimit
            ? "You've reached your monthly limit. Upgrade to create more posters."
            : 'Ready to create your next championship poster?'}
        </p>
      </div>

      {/* Usage Card */}
      <UsageCard />
    </section>
  );
}
