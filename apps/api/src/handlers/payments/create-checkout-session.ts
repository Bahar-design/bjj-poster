import type { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import Stripe from 'stripe';
import { createCheckoutSchema } from './types.js';
import { getPriceId } from './price-config.js';

// Validate required environment variables at module load time
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

// Initialize Stripe SDK at module scope for reuse across Lambda warm invocations
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Use specific origin from env, fallback to localhost for development
const CORS_ORIGIN = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Validate HTTPS in production
if (process.env.NODE_ENV === 'production' && !CORS_ORIGIN.startsWith('https://')) {
  throw new Error('Production CORS origin must use HTTPS');
}

function createResponse(statusCode: number, body: unknown): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': CORS_ORIGIN,
    },
    body: JSON.stringify(body),
  };
}

export const handler: APIGatewayProxyHandler = async (event) => {
  const requestId = event.requestContext.requestId;

  console.log('CreateCheckoutSession handler invoked', { requestId });

  // Check authentication
  const userId = event.requestContext.authorizer?.claims?.sub;
  if (!userId) {
    return createResponse(401, { message: 'Unauthorized' });
  }

  // Parse and validate body
  if (!event.body) {
    return createResponse(400, { message: 'Request body is required' });
  }

  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(event.body);
  } catch {
    return createResponse(400, { message: 'Invalid JSON body' });
  }

  const validation = createCheckoutSchema.safeParse(parsedBody);
  if (!validation.success) {
    return createResponse(400, {
      message: 'Invalid request',
      errors: validation.error.issues,
    });
  }

  const { tier, interval } = validation.data;

  // Get user email from auth claims (optional but improves UX)
  const userEmail = event.requestContext.authorizer?.claims?.email as string | undefined;

  try {
    const priceId = getPriceId(tier, interval);

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      client_reference_id: userId,
      customer_email: userEmail,
      success_url: `${CORS_ORIGIN}/dashboard?upgrade=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${CORS_ORIGIN}/pricing?upgrade=canceled`,
      metadata: {
        userId,
        tier,
        interval,
      },
    });

    // Validate session URL exists (can be null if session is expired or already used)
    if (!session.url) {
      console.error('Checkout session URL is null', {
        requestId,
        sessionId: session.id,
        status: session.status,
      });
      return createResponse(500, { message: 'Failed to create checkout session' });
    }

    console.log('Checkout session created', {
      requestId,
      sessionId: session.id,
      tier,
      interval,
    });

    return createResponse(200, { url: session.url });
  } catch (error) {
    // Log detailed error for debugging while returning safe message to client
    console.error('Failed to create checkout session', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    if (error instanceof Error && error.message.includes('Missing price ID')) {
      return createResponse(400, { message: error.message });
    }

    return createResponse(500, { message: 'Failed to create checkout session' });
  }
};
