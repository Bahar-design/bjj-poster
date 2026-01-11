import type { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import Stripe from 'stripe';
import { db } from '@bjj-poster/db';
import { createCheckoutSchema } from './types.js';
import type { PaymentErrorResponse } from './types.js';
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

// Rate limiting: 5 checkout sessions per user per hour
const RATE_LIMIT = 5;
const RATE_LIMIT_WINDOW_SECONDS = 3600; // 1 hour

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': CORS_ORIGIN,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400', // 24 hours
};

function createResponse(statusCode: number, body: unknown): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
    },
    body: JSON.stringify(body),
  };
}

function createErrorResponse(
  statusCode: number,
  message: string,
  code?: string
): APIGatewayProxyResult {
  const body: PaymentErrorResponse = { message };
  if (code) body.code = code;
  return createResponse(statusCode, body);
}

export const handler: APIGatewayProxyHandler = async (event) => {
  const requestId = event.requestContext.requestId;

  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: CORS_HEADERS,
      body: '',
    };
  }

  console.log('CreateCheckoutSession handler invoked', { requestId });

  // Check authentication
  const userId = event.requestContext.authorizer?.claims?.sub;
  if (!userId) {
    return createErrorResponse(401, 'Unauthorized', 'UNAUTHORIZED');
  }

  // Rate limiting
  try {
    const rateCheck = await db.rateLimits.checkAndIncrement(
      `checkout:${userId}`,
      RATE_LIMIT,
      RATE_LIMIT_WINDOW_SECONDS
    );

    if (!rateCheck.allowed) {
      console.warn('Rate limit exceeded for checkout', {
        requestId,
        userId,
        resetAt: new Date(rateCheck.resetAt * 1000).toISOString(),
      });
      return {
        statusCode: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(rateCheck.resetAt - Math.floor(Date.now() / 1000)),
          ...CORS_HEADERS,
        },
        body: JSON.stringify({
          message: 'Too many checkout attempts. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED',
          resetAt: rateCheck.resetAt,
        }),
      };
    }
  } catch (error) {
    // Log but don't fail - rate limit check failure shouldn't block checkout
    console.warn('Rate limit check failed, proceeding', {
      requestId,
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  // Parse and validate body
  if (!event.body) {
    return createErrorResponse(400, 'Request body is required', 'MISSING_BODY');
  }

  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(event.body);
  } catch {
    return createErrorResponse(400, 'Invalid JSON body', 'INVALID_JSON');
  }

  const validation = createCheckoutSchema.safeParse(parsedBody);
  if (!validation.success) {
    return createResponse(400, {
      message: 'Invalid request',
      code: 'VALIDATION_ERROR',
      details: validation.error.issues,
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
      return createErrorResponse(500, 'Failed to create checkout session', 'SESSION_URL_MISSING');
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
      return createErrorResponse(400, error.message, 'MISSING_PRICE_ID');
    }

    return createErrorResponse(500, 'Failed to create checkout session', 'CHECKOUT_FAILED');
  }
};
