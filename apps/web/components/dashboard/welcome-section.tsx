'use client';

import { useShallow } from 'zustand/react/shallow';
import { motion } from 'framer-motion';
import { useUserStore, UNLIMITED } from '@/lib/stores';
import { UsageCard } from './usage-card';
import { easings } from '@/lib/animations';

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
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: easings.easeOut }}
          className="font-display text-4xl tracking-wide text-white md:text-5xl"
        >
          WELCOME BACK{userName ? `, ${userName.toUpperCase()}` : ''}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: easings.easeOut }}
          className="mt-2 text-surface-400"
        >
          {isAtLimit
            ? "You've reached your monthly limit. Upgrade to create more posters."
            : 'Ready to create your next championship poster?'}
        </motion.p>
      </div>

      {/* Usage Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15, ease: easings.easeOut }}
      >
        <UsageCard />
      </motion.div>
    </section>
  );
}
