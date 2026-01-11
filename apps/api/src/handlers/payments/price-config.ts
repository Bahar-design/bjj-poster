type Tier = 'pro' | 'premium';
type Interval = 'month' | 'year';

const PRICE_ENV_KEYS: Record<Tier, Record<Interval, string>> = {
  pro: {
    month: 'STRIPE_PRICE_ID_PRO_MONTHLY',
    year: 'STRIPE_PRICE_ID_PRO_ANNUAL',
  },
  premium: {
    month: 'STRIPE_PRICE_ID_PREMIUM_MONTHLY',
    year: 'STRIPE_PRICE_ID_PREMIUM_ANNUAL',
  },
};

export function getPriceId(tier: Tier, interval: Interval): string {
  const envKey = PRICE_ENV_KEYS[tier][interval];
  const priceId = process.env[envKey];

  if (!priceId) {
    throw new Error(`Missing price ID for ${tier}/${interval}: ${envKey} not set`);
  }

  return priceId;
}

/**
 * Reverse lookup: get tier from Stripe price ID
 * Used by webhook to determine which tier was purchased
 */
export function getTierFromPriceId(priceId: string): Tier | null {
  for (const tier of ['pro', 'premium'] as const) {
    for (const interval of ['month', 'year'] as const) {
      const envKey = PRICE_ENV_KEYS[tier][interval];
      if (process.env[envKey] === priceId) {
        return tier;
      }
    }
  }
  return null;
}
