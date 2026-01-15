'use client';

import Link from 'next/link';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Zap, Rocket, Trophy } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { CheckoutButton, UpgradeSuccessHandler } from '@/components/checkout';
import { PageTransition, FadeUp, StaggerContainer, StaggerItem } from '@/components/ui/motion';
import { cn } from '@/lib/utils';
import { easings } from '@/lib/animations';

type BillingPeriod = 'monthly' | 'annual';

interface BillingToggleProps {
  value: BillingPeriod;
  onChange: (value: BillingPeriod) => void;
}

function BillingToggle({ value, onChange }: BillingToggleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3, ease: easings.easeOut }}
      role="radiogroup"
      aria-label="Billing period"
      className="mx-auto mt-10 inline-flex rounded-full bg-primary-800 p-1"
    >
      <motion.button
        type="button"
        role="radio"
        aria-checked={value === 'monthly'}
        onClick={() => onChange('monthly')}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          'rounded-full px-6 py-2 font-body text-sm font-medium transition-colors',
          value === 'monthly'
            ? 'bg-primary-600 text-white'
            : 'text-primary-300 hover:text-white'
        )}
      >
        Monthly
      </motion.button>
      <motion.button
        type="button"
        role="radio"
        aria-checked={value === 'annual'}
        onClick={() => onChange('annual')}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          'flex items-center gap-2 rounded-full px-6 py-2 font-body text-sm font-medium transition-colors',
          value === 'annual'
            ? 'bg-primary-600 text-white'
            : 'text-primary-300 hover:text-white'
        )}
      >
        Annual
        <motion.span
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="rounded-full bg-accent-gold/20 px-2 py-0.5 text-xs text-accent-gold"
        >
          Save 20%
        </motion.span>
      </motion.button>
    </motion.div>
  );
}

interface PricingTier {
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  description: string;
  features: { name: string; included: boolean }[];
  cta: string;
  ctaLink: string;
  popular?: boolean;
  icon: 'zap' | 'rocket' | 'crown';
}

const pricingTiers: PricingTier[] = [
  {
    name: 'Free',
    monthlyPrice: 0,
    annualPrice: 0,
    description: 'Perfect for trying out',
    icon: 'zap',
    features: [
      { name: '2 posters per month', included: true },
      { name: '720p resolution', included: true },
      { name: 'Watermarked exports', included: true },
      { name: 'Background removal', included: false },
      { name: 'AI backgrounds', included: false },
      { name: 'Priority support', included: false },
    ],
    cta: 'Get Started Free',
    ctaLink: '/auth/signup?plan=free',
  },
  {
    name: 'Pro',
    monthlyPrice: 9.99,
    annualPrice: 7.99,
    description: 'For serious athletes',
    icon: 'rocket',
    features: [
      { name: '20 posters per month', included: true },
      { name: '1080p HD resolution', included: true },
      { name: 'No watermark', included: true },
      { name: 'Background removal', included: true },
      { name: 'AI backgrounds', included: false },
      { name: 'Priority support', included: false },
    ],
    cta: 'Start Pro Trial',
    ctaLink: '/auth/signup?plan=pro',
    popular: true,
  },
  {
    name: 'Premium',
    monthlyPrice: 29.99,
    annualPrice: 23.99,
    description: 'For professionals & teams',
    icon: 'crown',
    features: [
      { name: 'Unlimited posters', included: true },
      { name: '4K resolution', included: true },
      { name: 'No watermark', included: true },
      { name: 'Background removal', included: true },
      { name: 'AI backgrounds', included: true },
      { name: 'Priority support', included: true },
    ],
    cta: 'Go Premium',
    ctaLink: '/auth/signup?plan=premium',
  },
];

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

interface PricingCardProps {
  tier: PricingTier;
  billingPeriod: BillingPeriod;
}

const tierIcons = {
  zap: Zap,
  rocket: Rocket,
  crown: Crown,
};

function PricingCard({ tier, billingPeriod }: PricingCardProps) {
  const price = billingPeriod === 'monthly' ? tier.monthlyPrice : tier.annualPrice;
  const formattedPrice = price === 0 ? '$0' : `$${price.toFixed(2)}`;
  const TierIcon = tierIcons[tier.icon];

  return (
    <motion.div
      whileHover={{ y: tier.popular ? -4 : -8 }}
      transition={{ duration: 0.3, ease: easings.easeOut }}
    >
      <Card
        className={cn(
          'relative flex flex-col bg-primary-800 text-white',
          tier.popular && 'border-2 border-accent-gold lg:scale-105'
        )}
      >
        {tier.popular && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5, ease: easings.elastic }}
            className="absolute -top-4 left-1/2 -translate-x-1/2"
          >
            <span className="rounded-full border border-accent-gold bg-accent-gold/10 px-4 py-1 font-body text-sm text-accent-gold">
              Most Popular
            </span>
          </motion.div>
        )}
        <CardHeader className={cn('text-center', tier.popular && 'pt-8')}>
          {/* Tier icon */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.4, ease: easings.elastic }}
            className={cn(
              'mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full',
              tier.popular
                ? 'bg-accent-gold/20 text-accent-gold'
                : 'bg-primary-700 text-primary-300'
            )}
          >
            <TierIcon className="h-6 w-6" aria-hidden="true" />
          </motion.div>
          <h2 className="font-display text-2xl">{tier.name}</h2>
          <p className="font-body text-sm text-primary-300">{tier.description}</p>
        </CardHeader>
        <CardContent className="flex-1">
          <div className="mb-6 text-center">
            <AnimatePresence mode="wait">
              <motion.span
                key={`${tier.name}-${billingPeriod}`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                className="font-display text-4xl"
              >
                {formattedPrice}
              </motion.span>
            </AnimatePresence>
            <span className="font-body text-primary-300">/month</span>
            {billingPeriod === 'annual' && price > 0 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-1 font-body text-sm text-primary-400"
              >
                Billed annually
              </motion.p>
            )}
          </div>
          <ul className="space-y-3" role="list">
            {tier.features.map((feature, index) => (
              <motion.li
                key={feature.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.4 + index * 0.05 }}
                className={cn(
                  'flex items-center gap-3 font-body text-sm',
                  feature.included ? 'text-white' : 'text-primary-400'
                )}
              >
                {feature.included ? (
                  <CheckIcon className="h-5 w-5 text-accent-gold" />
                ) : (
                  <XIcon className="h-5 w-5 text-primary-500" />
                )}
                {feature.name}
              </motion.li>
            ))}
          </ul>
        </CardContent>
        <CardFooter>
          {tier.monthlyPrice === 0 ? (
            <Button asChild variant={tier.popular ? 'default' : 'outline'} className="w-full">
              <Link href={tier.ctaLink}>{tier.cta}</Link>
            </Button>
          ) : (
            <CheckoutButton
              tier={tier.name.toLowerCase() as 'pro' | 'premium'}
              interval={billingPeriod === 'monthly' ? 'month' : 'year'}
              variant={tier.popular ? 'default' : 'outline'}
              className="w-full"
            >
              {tier.cta}
            </CheckoutButton>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
}

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');

  return (
    <PageTransition>
      <div className="relative min-h-screen overflow-hidden bg-primary-900">
        {/* Background atmospheric effects */}
        <div className="pointer-events-none fixed inset-0">
          {/* Central gold spotlight */}
          <div className="absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 bg-gradient-radial from-gold-500/10 via-gold-500/3 to-transparent" />

          {/* Corner mat glows */}
          <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-mat-500/5 blur-[100px]" />
          <div className="absolute -right-40 top-1/3 h-[400px] w-[400px] rounded-full bg-mat-500/5 blur-[80px]" />

          {/* Grain texture */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMC4wMyIvPjwvc3ZnPg==')] opacity-60" />
        </div>

        <main className="relative z-10 px-6 py-20 lg:px-8">
          <UpgradeSuccessHandler />
          <div className="mx-auto max-w-7xl">
            <FadeUp className="text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: easings.elastic }}
                className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-4 py-1.5"
              >
                <Crown className="h-4 w-4 text-gold-500" aria-hidden="true" />
                <span className="text-sm font-medium text-gold-400">Championship Pricing</span>
              </motion.div>

              <h1 className="font-display text-4xl text-white sm:text-5xl">
                INVEST IN YOUR{' '}
                <span className="text-gradient-gold">LEGACY</span>
              </h1>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2, ease: easings.easeOut }}
                className="mx-auto mt-4 max-w-2xl font-body text-lg text-primary-300"
              >
                Every champion deserves the right tools. Choose your path.
              </motion.p>
              <BillingToggle value={billingPeriod} onChange={setBillingPeriod} />
            </FadeUp>

            <StaggerContainer staggerDelay={0.15} className="mt-16 grid gap-8 lg:grid-cols-3 lg:items-start">
              {pricingTiers.map((tier) => (
                <StaggerItem key={tier.name} className={cn(tier.popular && 'order-first lg:order-none')}>
                  <PricingCard tier={tier} billingPeriod={billingPeriod} />
                </StaggerItem>
              ))}
            </StaggerContainer>

            {/* Bottom decorative element */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.6 }}
              className="mt-20 flex items-center justify-center gap-3"
            >
              <div className="h-px w-16 bg-gradient-to-r from-transparent to-gold-500/30" />
              <span className="text-xs uppercase tracking-widest text-surface-500">Train hard. Look legendary.</span>
              <div className="h-px w-16 bg-gradient-to-l from-transparent to-gold-500/30" />
            </motion.div>
          </div>
        </main>

        {/* Footer */}
        <footer className="relative z-10 border-t border-surface-800 bg-surface-950">
          <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
            <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
              <Link href="/" className="flex items-center gap-3">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-gold-400 to-gold-600"
                >
                  <Trophy className="h-5 w-5 text-surface-950" aria-hidden="true" />
                </motion.div>
                <span className="font-display text-xl tracking-wider text-white">BJJ POSTER</span>
              </Link>

              <div className="flex items-center gap-6 text-sm text-surface-500">
                <Link href="/pricing" className="transition-colors hover:text-gold-400">Pricing</Link>
                <Link href="#" className="transition-colors hover:text-gold-400">Privacy</Link>
                <Link href="#" className="transition-colors hover:text-gold-400">Terms</Link>
              </div>

              <p className="text-sm text-surface-600">
                &copy; {new Date().getFullYear()} BJJ Poster Builder. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </PageTransition>
  );
}
