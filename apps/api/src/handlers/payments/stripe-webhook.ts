import type { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import Stripe from 'stripe';
import { db } from '@bjj-poster/db';
import type { SubscriptionTier } from '@bjj-poster/db';
import { getTierFromPriceId } from './price-config.js';

// Validate required environment variables at module load time
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}
if (!process.env.STRIPE_WEBHOOK_SECRET) {
  throw new Error('STRIPE_WEBHOOK_SECRET environment variable is required');
}

// Initialize Stripe SDK at module scope for reuse across Lambda warm invocations
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Use specific origin from env, fallback to localhost for development
const CORS_ORIGIN = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Simple in-memory cache for processed events (cleared on Lambda cold start)
// For production, consider using DynamoDB with TTL for persistent idempotency
const processedEvents = new Set<string>();

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

  console.log('Stripe webhook handler invoked', { requestId });

  // Get signature from headers (case-insensitive)
  const signature =
    event.headers['stripe-signature'] || event.headers['Stripe-Signature'];

  if (!signature) {
    console.warn('Missing stripe-signature header', { requestId });
    return createResponse(400, { message: 'Missing stripe-signature header' });
  }

  if (!event.body) {
    return createResponse(400, { message: 'Missing request body' });
  }

  let stripeEvent: Stripe.Event;

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      signature,
      webhookSecret
    );
  } catch (error) {
    console.warn('Invalid webhook signature', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return createResponse(401, { message: 'Invalid signature' });
  }

  // Idempotency check: skip if we've already processed this event
  if (processedEvents.has(stripeEvent.id)) {
    console.log('Duplicate webhook event, skipping', {
      requestId,
      eventId: stripeEvent.id,
    });
    return createResponse(200, { received: true, duplicate: true });
  }

  console.log('Webhook event received', {
    requestId,
    type: stripeEvent.type,
    id: stripeEvent.id,
  });

  // Handle the event
  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object as Stripe.Checkout.Session;

    const userId = session.client_reference_id;
    const subscriptionId = session.subscription as string;
    const customerId = session.customer as string;

    if (!userId) {
      console.error('Missing client_reference_id in session', {
        requestId,
        sessionId: session.id,
      });
      return createResponse(400, { message: 'Missing client_reference_id' });
    }

    // Get tier from metadata first, fallback to price lookup
    let tier = session.metadata?.tier as SubscriptionTier | undefined;

    if (!tier && session.line_items?.data[0]?.price?.id) {
      tier = getTierFromPriceId(session.line_items.data[0].price.id) as SubscriptionTier;
    }

    // Default to pro if we can't determine the tier
    if (!tier) {
      console.warn('Could not determine tier, defaulting to pro', {
        requestId,
        sessionId: session.id,
      });
      tier = 'pro';
    }

    console.log('Processing subscription upgrade', {
      requestId,
      userId,
      subscriptionId,
      customerId,
      tier,
    });

    try {
      // Update user subscription in DynamoDB
      await db.users.updateSubscription(userId, {
        tier,
        stripeSubscriptionId: subscriptionId,
        stripeCustomerId: customerId,
      });

      console.log('Subscription upgrade processed', {
        requestId,
        userId,
        tier,
      });

      // Mark event as processed for idempotency
      processedEvents.add(stripeEvent.id);
    } catch (error) {
      console.error('Failed to update subscription in database', {
        requestId,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      // Return 500 so Stripe will retry
      return createResponse(500, { message: 'Failed to process subscription' });
    }
  }

  // Return 200 for all events (even unhandled ones)
  return createResponse(200, { received: true });
};
