import type { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import Stripe from 'stripe';
import { db } from '@bjj-poster/db';
import type { SubscriptionTier } from '@bjj-poster/db';
import { getTierFromPriceId } from './price-config.js';
import type { WebhookErrorResponse } from './types.js';

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

function createErrorResponse(
  statusCode: number,
  message: string,
  code?: string
): APIGatewayProxyResult {
  const body: WebhookErrorResponse = { message };
  if (code) body.code = code;
  return createResponse(statusCode, body);
}

/**
 * Extract raw body from API Gateway event.
 * Handles base64 encoded bodies which API Gateway may send.
 */
function getRawBody(event: { body: string | null; isBase64Encoded: boolean }): string | null {
  if (!event.body) return null;

  if (event.isBase64Encoded) {
    return Buffer.from(event.body, 'base64').toString('utf-8');
  }

  return event.body;
}

export const handler: APIGatewayProxyHandler = async (event) => {
  const requestId = event.requestContext.requestId;

  console.log('Stripe webhook handler invoked', { requestId });

  // Get signature from headers (case-insensitive)
  const signature =
    event.headers['stripe-signature'] || event.headers['Stripe-Signature'];

  if (!signature) {
    console.warn('Missing stripe-signature header', { requestId });
    return createErrorResponse(400, 'Missing stripe-signature header', 'MISSING_SIGNATURE');
  }

  // Handle base64 encoded bodies from API Gateway
  const rawBody = getRawBody(event);
  if (!rawBody) {
    return createErrorResponse(400, 'Missing request body', 'MISSING_BODY');
  }

  let stripeEvent: Stripe.Event;

  try {
    stripeEvent = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    console.warn('Invalid webhook signature', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return createErrorResponse(401, 'Invalid signature', 'INVALID_SIGNATURE');
  }

  console.log('Webhook event received', {
    requestId,
    type: stripeEvent.type,
    id: stripeEvent.id,
  });

  // Idempotency check using DynamoDB (persistent across Lambda cold starts)
  // If this fails, return 500 to prevent duplicate processing on retry
  try {
    const isDuplicate = await db.webhookEvents.checkAndMark(
      stripeEvent.id,
      stripeEvent.type
    );

    if (isDuplicate) {
      console.log('Duplicate webhook event, skipping', {
        requestId,
        eventId: stripeEvent.id,
      });
      return createResponse(200, { received: true, duplicate: true });
    }
  } catch (error) {
    // Cannot safely determine if this is a duplicate - return 500 so Stripe retries
    console.error('Idempotency check failed - cannot safely process', {
      requestId,
      eventId: stripeEvent.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return createErrorResponse(500, 'Idempotency check failed', 'IDEMPOTENCY_ERROR');
  }

  // Handle events based on type
  try {
    switch (stripeEvent.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(stripeEvent, requestId);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(stripeEvent, requestId);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(stripeEvent, requestId);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(stripeEvent, requestId);
        break;

      default:
        console.log('Unhandled event type', { requestId, type: stripeEvent.type });
    }
  } catch (error) {
    console.error('Failed to process webhook event', {
      requestId,
      eventType: stripeEvent.type,
      eventId: stripeEvent.id,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Remove from idempotency cache so Stripe can retry
    await db.webhookEvents.remove(stripeEvent.id).catch(() => {});

    return createErrorResponse(500, 'Failed to process webhook', 'PROCESSING_ERROR');
  }

  // Return 200 for all successfully processed events
  return createResponse(200, { received: true });
};

/**
 * Handle checkout.session.completed - new subscription created
 */
async function handleCheckoutCompleted(
  stripeEvent: Stripe.Event,
  requestId: string
): Promise<void> {
  const session = stripeEvent.data.object as Stripe.Checkout.Session;

  const userId = session.client_reference_id;
  const subscriptionId = session.subscription;
  const customerId = session.customer;

  // Validate required fields
  if (!userId || typeof userId !== 'string') {
    console.error('Missing or invalid client_reference_id in session', {
      requestId,
      sessionId: session.id,
    });
    throw new Error('Missing client_reference_id');
  }

  if (!subscriptionId || typeof subscriptionId !== 'string') {
    console.error('Missing or invalid subscription ID in session', {
      requestId,
      sessionId: session.id,
      subscriptionId,
    });
    throw new Error('Invalid subscription ID');
  }

  if (!customerId || typeof customerId !== 'string') {
    console.error('Missing or invalid customer ID in session', {
      requestId,
      sessionId: session.id,
      customerId,
    });
    throw new Error('Invalid customer ID');
  }

  // Get tier from metadata first
  let tier = session.metadata?.tier as SubscriptionTier | undefined;

  // Fallback: fetch subscription from Stripe to get price ID
  if (!tier) {
    console.log('Tier not in metadata, fetching from subscription', {
      requestId,
      subscriptionId,
    });

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const priceId = subscription.items.data[0]?.price.id;

    if (priceId) {
      tier = getTierFromPriceId(priceId) as SubscriptionTier;
    }
  }

  // Fail if we can't determine the tier
  if (!tier) {
    console.error('Could not determine subscription tier', {
      requestId,
      sessionId: session.id,
      metadata: session.metadata,
    });
    throw new Error('Could not determine subscription tier');
  }

  console.log('Processing subscription upgrade', {
    requestId,
    userId,
    subscriptionId,
    customerId,
    tier,
  });

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
}

/**
 * Handle customer.subscription.deleted - subscription cancelled or expired
 */
async function handleSubscriptionDeleted(
  stripeEvent: Stripe.Event,
  requestId: string
): Promise<void> {
  const subscription = stripeEvent.data.object as Stripe.Subscription;

  // Find user by subscription ID
  const user = await db.users.getByStripeSubscriptionId(subscription.id);

  if (!user) {
    console.warn('No user found for deleted subscription', {
      requestId,
      subscriptionId: subscription.id,
    });
    return;
  }

  console.log('Processing subscription cancellation', {
    requestId,
    userId: user.userId,
    subscriptionId: subscription.id,
  });

  // Downgrade to free tier
  await db.users.updateSubscription(user.userId, {
    tier: 'free',
    stripeSubscriptionId: null,
  });

  console.log('Subscription cancelled, downgraded to free', {
    requestId,
    userId: user.userId,
  });
}

/**
 * Handle customer.subscription.updated - plan changes
 */
async function handleSubscriptionUpdated(
  stripeEvent: Stripe.Event,
  requestId: string
): Promise<void> {
  const subscription = stripeEvent.data.object as Stripe.Subscription;

  // Only handle active subscriptions
  if (subscription.status !== 'active') {
    console.log('Ignoring non-active subscription update', {
      requestId,
      subscriptionId: subscription.id,
      status: subscription.status,
    });
    return;
  }

  // Find user by subscription ID
  const user = await db.users.getByStripeSubscriptionId(subscription.id);

  if (!user) {
    console.warn('No user found for updated subscription', {
      requestId,
      subscriptionId: subscription.id,
    });
    return;
  }

  // Get new tier from price ID
  const priceId = subscription.items.data[0]?.price.id;
  if (!priceId) {
    console.error('No price ID in subscription update', {
      requestId,
      subscriptionId: subscription.id,
    });
    return;
  }

  const newTier = getTierFromPriceId(priceId) as SubscriptionTier;
  if (!newTier) {
    console.error('Unknown price ID in subscription update', {
      requestId,
      subscriptionId: subscription.id,
      priceId,
    });
    return;
  }

  // Only update if tier changed
  if (user.subscriptionTier === newTier) {
    console.log('Tier unchanged, skipping update', {
      requestId,
      userId: user.userId,
      tier: newTier,
    });
    return;
  }

  console.log('Processing tier change', {
    requestId,
    userId: user.userId,
    oldTier: user.subscriptionTier,
    newTier,
  });

  await db.users.updateSubscription(user.userId, {
    tier: newTier,
    stripeSubscriptionId: subscription.id,
  });

  console.log('Tier updated', {
    requestId,
    userId: user.userId,
    tier: newTier,
  });
}

/**
 * Handle invoice.payment_failed - payment failed, may lead to cancellation
 */
async function handlePaymentFailed(
  stripeEvent: Stripe.Event,
  requestId: string
): Promise<void> {
  const invoice = stripeEvent.data.object as Stripe.Invoice;

  if (!invoice.subscription || typeof invoice.subscription !== 'string') {
    console.log('Payment failed for non-subscription invoice', {
      requestId,
      invoiceId: invoice.id,
    });
    return;
  }

  // Find user by subscription ID
  const user = await db.users.getByStripeSubscriptionId(invoice.subscription);

  if (!user) {
    console.warn('No user found for failed payment', {
      requestId,
      subscriptionId: invoice.subscription,
    });
    return;
  }

  console.warn('Payment failed for subscription', {
    requestId,
    userId: user.userId,
    subscriptionId: invoice.subscription,
    attemptCount: invoice.attempt_count,
  });

  // Note: We don't downgrade immediately on payment failure.
  // Stripe will retry the payment and eventually cancel the subscription
  // if all retries fail, which will trigger customer.subscription.deleted.
  // This event is logged for monitoring/alerting purposes.
}
