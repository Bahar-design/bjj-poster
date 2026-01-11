import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getPriceId } from '../price-config.js';

describe('getPriceId', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...originalEnv,
      STRIPE_PRICE_ID_PRO_MONTHLY: 'price_pro_month',
      STRIPE_PRICE_ID_PRO_ANNUAL: 'price_pro_year',
      STRIPE_PRICE_ID_PREMIUM_MONTHLY: 'price_premium_month',
      STRIPE_PRICE_ID_PREMIUM_ANNUAL: 'price_premium_year',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns pro monthly price ID', () => {
    const priceId = getPriceId('pro', 'month');
    expect(priceId).toBe('price_pro_month');
  });

  it('returns pro annual price ID', () => {
    const priceId = getPriceId('pro', 'year');
    expect(priceId).toBe('price_pro_year');
  });

  it('returns premium monthly price ID', () => {
    const priceId = getPriceId('premium', 'month');
    expect(priceId).toBe('price_premium_month');
  });

  it('returns premium annual price ID', () => {
    const priceId = getPriceId('premium', 'year');
    expect(priceId).toBe('price_premium_year');
  });

  it('throws if price ID env var is missing', () => {
    delete process.env.STRIPE_PRICE_ID_PRO_MONTHLY;
    expect(() => getPriceId('pro', 'month')).toThrow('Missing price ID');
  });
});
