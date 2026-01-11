import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCheckoutSession } from '../checkout';

describe('createCheckoutSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('calls API with correct parameters', async () => {
    const mockResponse = { url: 'https://checkout.stripe.com/pay/cs_test_123' };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await createCheckoutSession({ tier: 'pro', interval: 'month' });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/payments/checkout'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: 'pro', interval: 'month' }),
      })
    );
    expect(result.url).toBe(mockResponse.url);
  });

  it('throws ApiError on HTTP error', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
    });

    await expect(createCheckoutSession({ tier: 'pro', interval: 'month' })).rejects.toThrow(
      'API error'
    );
  });

  it('throws ApiError on network error', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network failed'));

    await expect(createCheckoutSession({ tier: 'pro', interval: 'month' })).rejects.toThrow(
      'Network error'
    );
  });
});
