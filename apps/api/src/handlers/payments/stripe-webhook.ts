import type { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import Stripe from 'stripe';
import { getTierFromPriceId } from './price-config.js';

function createResponse(statusCode: number, body: unknown): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
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

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-11-20.acacia',
  });

  let stripeEvent: Stripe.Event;

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.warn('Invalid webhook signature', { requestId, error });
    return createResponse(401, { message: 'Invalid signature' });
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

    if (!userId) {
      console.error('Missing client_reference_id in session', {
        requestId,
        sessionId: session.id,
      });
      return createResponse(400, { message: 'Missing client_reference_id' });
    }

    // Get tier from metadata or price lookup
    const tier = session.metadata?.tier || null;

    console.log('Processing subscription upgrade', {
      requestId,
      userId,
      subscriptionId,
      tier,
    });

    // TODO: Update user subscription in DynamoDB
    // await db.users.updateSubscription(userId, { tier, subscriptionId });

    console.log('Subscription upgrade processed', {
      requestId,
      userId,
      tier,
    });
  }

  // Return 200 for all events (even unhandled ones)
  return createResponse(200, { received: true });
};
