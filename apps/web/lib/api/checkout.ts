import { API_BASE_URL } from './config';
import { ApiError } from './client';

export interface CreateCheckoutParams {
  tier: 'pro' | 'premium';
  interval: 'month' | 'year';
}

export interface CheckoutResponse {
  url: string;
}

/**
 * Creates a Stripe Checkout session for subscription upgrade
 * Returns the Stripe Checkout URL to redirect to
 */
export async function createCheckoutSession(
  params: CreateCheckoutParams
): Promise<CheckoutResponse> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/api/payments/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });
  } catch (error) {
    throw new ApiError(
      0,
      `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      { cause: error }
    );
  }

  if (!response.ok) {
    throw new ApiError(response.status, `API error: ${response.statusText}`);
  }

  return response.json();
}
