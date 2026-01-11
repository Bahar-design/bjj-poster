import { z } from 'zod';

export const createCheckoutSchema = z.object({
  tier: z.enum(['pro', 'premium']),
  interval: z.enum(['month', 'year']),
});

export type CreateCheckoutRequest = z.infer<typeof createCheckoutSchema>;

export interface CreateCheckoutResponse {
  url: string;
}

export type SubscriptionTier = 'free' | 'pro' | 'premium';

/**
 * Standard error response format for payment endpoints
 */
export interface PaymentErrorResponse {
  message: string;
  code?: string;
  details?: unknown;
}

/**
 * Error response for webhook endpoints
 */
export interface WebhookErrorResponse {
  message: string;
  code?: string;
}
