'use client';

import { motion } from 'framer-motion';

import { WelcomeSection, CreateNewCard } from '@/components/dashboard';
import { UpgradeSuccessHandler } from '@/components/checkout';
import { WelcomeSplash } from '@/components/onboarding';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import {
  PageTransition,
  FadeUp,
  StaggerContainer,
  StaggerItem,
} from '@/components/ui/motion';
import { BeltRankIndicator } from '@/components/ui/bjj-belt';

export default function DashboardPage(): JSX.Element {
  return (
    <PageTransition>
      <div className="relative min-h-screen overflow-hidden">
        {/* Background atmospheric effects */}
        <div className="pointer-events-none fixed inset-0">
          {/* Top spotlight glow */}
          <div className="absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 bg-gradient-radial from-gold-500/10 via-gold-500/5 to-transparent opacity-60" />

          {/* Corner mat glow */}
          <div className="absolute -bottom-20 -right-20 h-[400px] w-[400px] rounded-full bg-mat-500/5 blur-3xl" />

          {/* Subtle grain texture */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')] opacity-50" />
        </div>

        <main id="main-content" className="relative z-10 mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">
          <WelcomeSplash />
          <UpgradeSuccessHandler />
          <ErrorBoundary>
            <WelcomeSection />
          </ErrorBoundary>

          {/* Your Posters Section */}
          <FadeUp delay={0.2}>
            <section>
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h2 className="font-display text-2xl tracking-wide text-white">
                    YOUR POSTERS
                  </h2>
                  {/* Belt rank progress indicator */}
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5, duration: 0.4 }}
                  >
                    <BeltRankIndicator currentRank="white" className="hidden sm:flex" />
                  </motion.div>
                </div>

                {/* Decorative stripe */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.6, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="hidden h-[2px] flex-1 origin-left bg-gradient-to-r from-gold-500/50 via-gold-500/20 to-transparent md:mx-6 md:block"
                />
              </div>

              <StaggerContainer staggerDelay={0.08} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {/* Create New Card - Always first */}
                <StaggerItem>
                  <CreateNewCard />
                </StaggerItem>

                {/* Poster cards will be rendered here by ODE-72 */}
              </StaggerContainer>
            </section>
          </FadeUp>
        </main>
      </div>
    </PageTransition>
  );
}
