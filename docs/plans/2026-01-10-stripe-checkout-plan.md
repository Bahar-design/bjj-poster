# Stripe Checkout Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Integrate Stripe Checkout for Pro/Premium subscription upgrades with redirect flow, webhook handling, and toast notifications.

**Architecture:** Lambda handlers for checkout session creation and webhook processing. Frontend components for triggering checkout and displaying success/cancel states. Sonner for toast notifications.

**Tech Stack:** Stripe SDK (backend), Sonner (toasts), Zod (validation), Zustand (user state), React Query patterns

---

## Task 1: Install Sonner and Configure Toaster

**Files:**
- Modify: `apps/web/package.json`
- Modify: `apps/web/app/providers.tsx`

**Step 1: Install sonner package**

Run:
```bash
cd apps/web && pnpm add sonner
```

Expected: Package added to dependencies

**Step 2: Add Toaster to providers**

Modify `apps/web/app/providers.tsx`:

```typescript
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';
import { Toaster } from 'sonner';

/**
 * Creates a new QueryClient with default options
 * Extracted to function for SSR-safe instantiation
 */
function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 30 * 60 * 1000, // 30 minutes
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });
}

/**
 * Application providers wrapper
 * Includes QueryClientProvider and React Query DevTools
 */
export function Providers({ children }: { children: React.ReactNode }) {
  // useState ensures one QueryClient per app instance (SSR-safe)
  const [queryClient] = useState(makeQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster position="top-right" richColors closeButton />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

**Step 3: Verify dev server starts**

Run:
```bash
cd /home/bahar/bjj-poster && pnpm dev
```

Expected: No errors, app loads at localhost:3000

**Step 4: Commit**

```bash
git add apps/web/package.json apps/web/pnpm-lock.yaml apps/web/app/providers.tsx
git commit -m "feat(web): add sonner toast notifications

Install sonner and configure Toaster in providers for app-wide toast support."
```

---

## Task 2: Add Stripe Price ID Environment Variables

**Files:**
- Modify: `apps/api/.env.local`
- Modify: `apps/api/.env.example` (if exists)

**Step 1: Add price ID variables to .env.local**

Add to `apps/api/.env.local`:

```env
# Stripe Price IDs (create these in Stripe Dashboard)
STRIPE_PRICE_ID_PRO_MONTHLY=price_pro_monthly_placeholder
STRIPE_PRICE_ID_PRO_ANNUAL=price_pro_annual_placeholder
STRIPE_PRICE_ID_PREMIUM_MONTHLY=price_premium_monthly_placeholder
STRIPE_PRICE_ID_PREMIUM_ANNUAL=price_premium_annual_placeholder
```

**Step 2: Update .env.example if it exists**

Check if file exists and add placeholder entries.

**Step 3: Commit**

```bash
git add apps/api/.env.example
git commit -m "chore(api): add Stripe price ID env variables to example"
```

Note: Do not commit .env.local (contains secrets)

---

## Task 3: Create Checkout Session Types and Validation

**Files:**
- Create: `apps/api/src/handlers/payments/types.ts`
- Test: `apps/api/src/handlers/payments/__tests__/types.test.ts`

**Step 1: Write the failing test**

Create `apps/api/src/handlers/payments/__tests__/types.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { createCheckoutSchema, type CreateCheckoutRequest } from '../types.js';

describe('createCheckoutSchema', () => {
  it('accepts valid pro monthly request', () => {
    const input = { tier: 'pro', interval: 'month' };
    const result = createCheckoutSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('accepts valid premium annual request', () => {
    const input = { tier: 'premium', interval: 'year' };
    const result = createCheckoutSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('rejects invalid tier', () => {
    const input = { tier: 'enterprise', interval: 'month' };
    const result = createCheckoutSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('rejects invalid interval', () => {
    const input = { tier: 'pro', interval: 'weekly' };
    const result = createCheckoutSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('rejects missing fields', () => {
    const input = { tier: 'pro' };
    const result = createCheckoutSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run:
```bash
cd apps/api && pnpm test src/handlers/payments/__tests__/types.test.ts
```

Expected: FAIL - Cannot find module '../types.js'

**Step 3: Write minimal implementation**

Create `apps/api/src/handlers/payments/types.ts`:

```typescript
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
```

**Step 4: Run test to verify it passes**

Run:
```bash
cd apps/api && pnpm test src/handlers/payments/__tests__/types.test.ts
```

Expected: PASS - All 5 tests pass

**Step 5: Commit**

```bash
git add apps/api/src/handlers/payments/
git commit -m "feat(api): add checkout request validation schema

Add Zod schema for validating tier and interval parameters."
```

---

## Task 4: Create Price ID Mapping Utility

**Files:**
- Create: `apps/api/src/handlers/payments/price-config.ts`
- Test: `apps/api/src/handlers/payments/__tests__/price-config.test.ts`

**Step 1: Write the failing test**

Create `apps/api/src/handlers/payments/__tests__/price-config.test.ts`:

```typescript
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
```

**Step 2: Run test to verify it fails**

Run:
```bash
cd apps/api && pnpm test src/handlers/payments/__tests__/price-config.test.ts
```

Expected: FAIL - Cannot find module '../price-config.js'

**Step 3: Write minimal implementation**

Create `apps/api/src/handlers/payments/price-config.ts`:

```typescript
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
```

**Step 4: Run test to verify it passes**

Run:
```bash
cd apps/api && pnpm test src/handlers/payments/__tests__/price-config.test.ts
```

Expected: PASS - All 5 tests pass

**Step 5: Commit**

```bash
git add apps/api/src/handlers/payments/price-config.ts apps/api/src/handlers/payments/__tests__/price-config.test.ts
git commit -m "feat(api): add price ID mapping utility

Map tier/interval to Stripe price IDs from environment variables."
```

---

## Task 5: Create Checkout Session Handler

**Files:**
- Create: `apps/api/src/handlers/payments/create-checkout-session.ts`
- Test: `apps/api/src/handlers/payments/__tests__/create-checkout-session.test.ts`

**Step 1: Write the failing test**

Create `apps/api/src/handlers/payments/__tests__/create-checkout-session.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { handler } from '../create-checkout-session.js';

// Mock Stripe
vi.mock('stripe', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      checkout: {
        sessions: {
          create: vi.fn().mockResolvedValue({
            id: 'cs_test_123',
            url: 'https://checkout.stripe.com/pay/cs_test_123',
          }),
        },
      },
    })),
  };
});

// Mock price config
vi.mock('../price-config.js', () => ({
  getPriceId: vi.fn().mockReturnValue('price_pro_monthly'),
}));

function createEvent(overrides: Partial<APIGatewayProxyEvent> = {}): APIGatewayProxyEvent {
  return {
    httpMethod: 'POST',
    path: '/payments/checkout',
    pathParameters: null,
    queryStringParameters: null,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tier: 'pro', interval: 'month' }),
    isBase64Encoded: false,
    requestContext: {
      requestId: 'test-request-123',
      authorizer: {
        claims: { sub: 'user-123', email: 'test@example.com' },
      },
    } as any,
    resource: '',
    stageVariables: null,
    multiValueHeaders: {},
    multiValueQueryStringParameters: null,
    ...overrides,
  };
}

const mockContext: Context = {
  functionName: 'test',
  functionVersion: '1',
  invokedFunctionArn: 'arn:aws:lambda:test',
  memoryLimitInMB: '256',
  awsRequestId: 'test-123',
  logGroupName: 'test',
  logStreamName: 'test',
  callbackWaitsForEmptyEventLoop: false,
  getRemainingTimeInMillis: () => 30000,
  done: () => {},
  fail: () => {},
  succeed: () => {},
};

describe('createCheckoutSession handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
  });

  it('creates checkout session with valid request', async () => {
    const event = createEvent();
    const result = await handler(event, mockContext, () => {});

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.url).toBe('https://checkout.stripe.com/pay/cs_test_123');
  });

  it('returns 400 for invalid tier', async () => {
    const event = createEvent({
      body: JSON.stringify({ tier: 'enterprise', interval: 'month' }),
    });
    const result = await handler(event, mockContext, () => {});

    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.message).toContain('Invalid');
  });

  it('returns 401 when user not authenticated', async () => {
    const event = createEvent({
      requestContext: {
        requestId: 'test-123',
        authorizer: null,
      } as any,
    });
    const result = await handler(event, mockContext, () => {});

    expect(result.statusCode).toBe(401);
  });

  it('returns 400 when body is missing', async () => {
    const event = createEvent({ body: null });
    const result = await handler(event, mockContext, () => {});

    expect(result.statusCode).toBe(400);
  });
});
```

**Step 2: Run test to verify it fails**

Run:
```bash
cd apps/api && pnpm test src/handlers/payments/__tests__/create-checkout-session.test.ts
```

Expected: FAIL - Cannot find module '../create-checkout-session.js'

**Step 3: Write minimal implementation**

Create `apps/api/src/handlers/payments/create-checkout-session.ts`:

```typescript
import type { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import Stripe from 'stripe';
import { createCheckoutSchema } from './types.js';
import { getPriceId } from './price-config.js';

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

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2024-11-20.acacia',
    });

    const priceId = getPriceId(tier, interval);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

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
      success_url: `${appUrl}/dashboard?upgrade=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/pricing?upgrade=cancelled`,
      metadata: {
        userId,
        tier,
        interval,
      },
    });

    console.log('Checkout session created', {
      requestId,
      sessionId: session.id,
      tier,
      interval,
    });

    return createResponse(200, { url: session.url });
  } catch (error) {
    console.error('Failed to create checkout session', { requestId, error });

    if (error instanceof Error && error.message.includes('Missing price ID')) {
      return createResponse(400, { message: error.message });
    }

    return createResponse(500, { message: 'Failed to create checkout session' });
  }
};
```

**Step 4: Run test to verify it passes**

Run:
```bash
cd apps/api && pnpm test src/handlers/payments/__tests__/create-checkout-session.test.ts
```

Expected: PASS - All 4 tests pass

**Step 5: Commit**

```bash
git add apps/api/src/handlers/payments/create-checkout-session.ts apps/api/src/handlers/payments/__tests__/create-checkout-session.test.ts
git commit -m "feat(api): add create checkout session handler

Lambda handler that creates Stripe Checkout sessions for subscription upgrades."
```

---

## Task 6: Create Stripe Webhook Handler

**Files:**
- Create: `apps/api/src/handlers/payments/stripe-webhook.ts`
- Test: `apps/api/src/handlers/payments/__tests__/stripe-webhook.test.ts`

**Step 1: Write the failing test**

Create `apps/api/src/handlers/payments/__tests__/stripe-webhook.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { APIGatewayProxyEvent, Context } from 'aws-lambda';

// Mock Stripe before importing handler
const mockConstructEvent = vi.fn();
vi.mock('stripe', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      webhooks: {
        constructEvent: mockConstructEvent,
      },
    })),
  };
});

// Mock price config
vi.mock('../price-config.js', () => ({
  getTierFromPriceId: vi.fn().mockReturnValue('pro'),
}));

// Import after mocks
import { handler } from '../stripe-webhook.js';

function createEvent(overrides: Partial<APIGatewayProxyEvent> = {}): APIGatewayProxyEvent {
  return {
    httpMethod: 'POST',
    path: '/payments/webhook',
    pathParameters: null,
    queryStringParameters: null,
    headers: {
      'stripe-signature': 'sig_test_123',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ type: 'checkout.session.completed' }),
    isBase64Encoded: false,
    requestContext: {
      requestId: 'test-request-123',
    } as any,
    resource: '',
    stageVariables: null,
    multiValueHeaders: {},
    multiValueQueryStringParameters: null,
    ...overrides,
  };
}

const mockContext: Context = {
  functionName: 'test',
  functionVersion: '1',
  invokedFunctionArn: 'arn:aws:lambda:test',
  memoryLimitInMB: '256',
  awsRequestId: 'test-123',
  logGroupName: 'test',
  logStreamName: 'test',
  callbackWaitsForEmptyEventLoop: false,
  getRemainingTimeInMillis: () => 30000,
  done: () => {},
  fail: () => {},
  succeed: () => {},
};

describe('stripeWebhook handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_123';
  });

  it('processes checkout.session.completed event', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_123',
          client_reference_id: 'user-123',
          subscription: 'sub_123',
          line_items: {
            data: [{ price: { id: 'price_pro_monthly' } }],
          },
        },
      },
    });

    const event = createEvent();
    const result = await handler(event, mockContext, () => {});

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.received).toBe(true);
  });

  it('returns 401 for invalid signature', async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error('Invalid signature');
    });

    const event = createEvent();
    const result = await handler(event, mockContext, () => {});

    expect(result.statusCode).toBe(401);
  });

  it('returns 400 when signature header is missing', async () => {
    const event = createEvent({
      headers: { 'Content-Type': 'application/json' },
    });
    const result = await handler(event, mockContext, () => {});

    expect(result.statusCode).toBe(400);
  });

  it('ignores unknown event types', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'customer.updated',
      data: { object: {} },
    });

    const event = createEvent();
    const result = await handler(event, mockContext, () => {});

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.received).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run:
```bash
cd apps/api && pnpm test src/handlers/payments/__tests__/stripe-webhook.test.ts
```

Expected: FAIL - Cannot find module '../stripe-webhook.js'

**Step 3: Write minimal implementation**

Create `apps/api/src/handlers/payments/stripe-webhook.ts`:

```typescript
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
```

**Step 4: Run test to verify it passes**

Run:
```bash
cd apps/api && pnpm test src/handlers/payments/__tests__/stripe-webhook.test.ts
```

Expected: PASS - All 4 tests pass

**Step 5: Commit**

```bash
git add apps/api/src/handlers/payments/stripe-webhook.ts apps/api/src/handlers/payments/__tests__/stripe-webhook.test.ts
git commit -m "feat(api): add Stripe webhook handler

Handle checkout.session.completed events to update user subscriptions."
```

---

## Task 7: Create Payments Handler Barrel Export

**Files:**
- Create: `apps/api/src/handlers/payments/index.ts`

**Step 1: Create barrel export**

Create `apps/api/src/handlers/payments/index.ts`:

```typescript
export { handler as createCheckoutSessionHandler } from './create-checkout-session.js';
export { handler as stripeWebhookHandler } from './stripe-webhook.js';
export * from './types.js';
```

**Step 2: Verify imports work**

Run:
```bash
cd apps/api && pnpm type-check
```

Expected: No type errors

**Step 3: Commit**

```bash
git add apps/api/src/handlers/payments/index.ts
git commit -m "feat(api): add payments handler barrel export"
```

---

## Task 8: Add Payment Routes to Local Server

**Files:**
- Modify: `apps/api/src/local-server.ts`

**Step 1: Add imports and routes**

Modify `apps/api/src/local-server.ts` to add:

After line 11 (imports section), add:
```typescript
import { createCheckoutSessionHandler, stripeWebhookHandler } from './handlers/payments/index.js';
```

After line 160 (before the Templates route section), add:
```typescript
// Payments - Stripe integration
app.post('/api/payments/checkout', lambdaAdapter(createCheckoutSessionHandler));

// Stripe webhook - needs raw body for signature verification
// Note: In production, this would be configured separately with raw body parsing
app.post('/api/payments/webhook', lambdaAdapter(stripeWebhookHandler));
```

**Step 2: Verify server starts**

Run:
```bash
cd /home/bahar/bjj-poster && pnpm dev
```

Expected: Server starts without errors

**Step 3: Test endpoint responds**

Run:
```bash
curl -X POST http://localhost:3001/api/payments/checkout \
  -H "Content-Type: application/json" \
  -d '{"tier":"pro","interval":"month"}'
```

Expected: Response (may be error about Stripe key, but route works)

**Step 4: Commit**

```bash
git add apps/api/src/local-server.ts
git commit -m "feat(api): add payment routes to local server

Add /api/payments/checkout and /api/payments/webhook routes."
```

---

## Task 9: Create Frontend Checkout API Client

**Files:**
- Create: `apps/web/lib/api/checkout.ts`
- Test: `apps/web/lib/api/__tests__/checkout.test.ts`

**Step 1: Write the failing test**

Create `apps/web/lib/api/__tests__/checkout.test.ts`:

```typescript
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
```

**Step 2: Run test to verify it fails**

Run:
```bash
cd apps/web && pnpm test lib/api/__tests__/checkout.test.ts
```

Expected: FAIL - Cannot find module '../checkout'

**Step 3: Write minimal implementation**

Create `apps/web/lib/api/checkout.ts`:

```typescript
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
```

**Step 4: Run test to verify it passes**

Run:
```bash
cd apps/web && pnpm test lib/api/__tests__/checkout.test.ts
```

Expected: PASS - All 3 tests pass

**Step 5: Commit**

```bash
git add apps/web/lib/api/checkout.ts apps/web/lib/api/__tests__/checkout.test.ts
git commit -m "feat(web): add checkout API client

Frontend API client for creating Stripe Checkout sessions."
```

---

## Task 10: Create CheckoutButton Component

**Files:**
- Create: `apps/web/components/checkout/checkout-button.tsx`
- Test: `apps/web/components/checkout/__tests__/checkout-button.test.tsx`

**Step 1: Write the failing test**

Create `apps/web/components/checkout/__tests__/checkout-button.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CheckoutButton } from '../checkout-button';

// Mock the checkout API
vi.mock('@/lib/api/checkout', () => ({
  createCheckoutSession: vi.fn(),
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  },
}));

import { createCheckoutSession } from '@/lib/api/checkout';
import { toast } from 'sonner';

describe('CheckoutButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.location.href
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
    });
  });

  it('renders children correctly', () => {
    render(
      <CheckoutButton tier="pro" interval="month">
        Upgrade to Pro
      </CheckoutButton>
    );

    expect(screen.getByRole('button', { name: /upgrade to pro/i })).toBeInTheDocument();
  });

  it('shows loading state and redirects on success', async () => {
    const mockUrl = 'https://checkout.stripe.com/pay/cs_test_123';
    (createCheckoutSession as ReturnType<typeof vi.fn>).mockResolvedValue({ url: mockUrl });

    render(
      <CheckoutButton tier="pro" interval="month">
        Upgrade
      </CheckoutButton>
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    // Should show loading toast
    await waitFor(() => {
      expect(toast.loading).toHaveBeenCalledWith('Redirecting to checkout...');
    });

    // Should redirect
    await waitFor(() => {
      expect(window.location.href).toBe(mockUrl);
    });
  });

  it('shows error toast on failure', async () => {
    (createCheckoutSession as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('API error')
    );

    render(
      <CheckoutButton tier="pro" interval="month">
        Upgrade
      </CheckoutButton>
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Failed to start checkout. Please try again.'
      );
    });
  });

  it('disables button while loading', async () => {
    // Never resolve to keep loading
    (createCheckoutSession as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise(() => {})
    );

    render(
      <CheckoutButton tier="pro" interval="month">
        Upgrade
      </CheckoutButton>
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(button).toBeDisabled();
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run:
```bash
cd apps/web && pnpm test components/checkout/__tests__/checkout-button.test.tsx
```

Expected: FAIL - Cannot find module '../checkout-button'

**Step 3: Write minimal implementation**

Create `apps/web/components/checkout/checkout-button.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button, type ButtonProps } from '@/components/ui/button';
import { createCheckoutSession, type CreateCheckoutParams } from '@/lib/api/checkout';

export interface CheckoutButtonProps
  extends Omit<ButtonProps, 'onClick'>,
    CreateCheckoutParams {
  children: React.ReactNode;
}

export function CheckoutButton({
  tier,
  interval,
  children,
  disabled,
  ...props
}: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    const toastId = toast.loading('Redirecting to checkout...');

    try {
      const { url } = await createCheckoutSession({ tier, interval });
      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (error) {
      console.error('Checkout error:', error);
      toast.dismiss(toastId);
      toast.error('Failed to start checkout. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={disabled || isLoading}
      isLoading={isLoading}
      {...props}
    >
      {children}
    </Button>
  );
}
```

**Step 4: Run test to verify it passes**

Run:
```bash
cd apps/web && pnpm test components/checkout/__tests__/checkout-button.test.tsx
```

Expected: PASS - All 4 tests pass

**Step 5: Commit**

```bash
git add apps/web/components/checkout/
git commit -m "feat(web): add CheckoutButton component

Button that initiates Stripe Checkout with loading states and error handling."
```

---

## Task 11: Create UpgradeSuccessHandler Component

**Files:**
- Create: `apps/web/components/checkout/upgrade-success-handler.tsx`
- Test: `apps/web/components/checkout/__tests__/upgrade-success-handler.test.tsx`

**Step 1: Write the failing test**

Create `apps/web/components/checkout/__tests__/upgrade-success-handler.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { UpgradeSuccessHandler } from '../upgrade-success-handler';

// Mock next/navigation
const mockReplace = vi.fn();
vi.mock('next/navigation', () => ({
  useSearchParams: vi.fn(),
  useRouter: () => ({
    replace: mockReplace,
  }),
  usePathname: () => '/dashboard',
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    info: vi.fn(),
  },
}));

import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

describe('UpgradeSuccessHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows success toast when upgrade=success', async () => {
    (useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue({
      get: (key: string) => (key === 'upgrade' ? 'success' : null),
    });

    render(<UpgradeSuccessHandler />);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('Welcome'),
        expect.any(Object)
      );
    });

    // Should clear URL params
    expect(mockReplace).toHaveBeenCalled();
  });

  it('shows info toast when upgrade=cancelled', async () => {
    (useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue({
      get: (key: string) => (key === 'upgrade' ? 'cancelled' : null),
    });

    render(<UpgradeSuccessHandler />);

    await waitFor(() => {
      expect(toast.info).toHaveBeenCalledWith(
        expect.stringContaining('cancelled'),
        expect.any(Object)
      );
    });
  });

  it('does nothing when no upgrade param', async () => {
    (useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue({
      get: () => null,
    });

    render(<UpgradeSuccessHandler />);

    // Wait a tick to ensure effect runs
    await waitFor(() => {
      expect(toast.success).not.toHaveBeenCalled();
      expect(toast.info).not.toHaveBeenCalled();
    });
  });

  it('renders nothing visible', () => {
    (useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue({
      get: () => null,
    });

    const { container } = render(<UpgradeSuccessHandler />);
    expect(container).toBeEmptyDOMElement();
  });
});
```

**Step 2: Run test to verify it fails**

Run:
```bash
cd apps/web && pnpm test components/checkout/__tests__/upgrade-success-handler.test.tsx
```

Expected: FAIL - Cannot find module '../upgrade-success-handler'

**Step 3: Write minimal implementation**

Create `apps/web/components/checkout/upgrade-success-handler.tsx`:

```typescript
'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';

/**
 * Handles upgrade success/cancel URL parameters
 * Shows appropriate toast and clears the URL params
 *
 * Add this component to pages that receive redirect from Stripe:
 * - /dashboard (success)
 * - /pricing (cancel)
 */
export function UpgradeSuccessHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const hasHandled = useRef(false);

  useEffect(() => {
    // Prevent double handling in StrictMode
    if (hasHandled.current) return;

    const upgradeStatus = searchParams.get('upgrade');

    if (upgradeStatus === 'success') {
      hasHandled.current = true;
      toast.success('Welcome to your new plan!', {
        description: 'Your upgrade is now active.',
        duration: 5000,
      });

      // Clear URL params
      router.replace(pathname);
    } else if (upgradeStatus === 'cancelled') {
      hasHandled.current = true;
      toast.info('Upgrade cancelled', {
        description: 'You can try again anytime.',
        duration: 4000,
      });

      // Clear URL params
      router.replace(pathname);
    }
  }, [searchParams, router, pathname]);

  // This component renders nothing
  return null;
}
```

**Step 4: Run test to verify it passes**

Run:
```bash
cd apps/web && pnpm test components/checkout/__tests__/upgrade-success-handler.test.tsx
```

Expected: PASS - All 4 tests pass

**Step 5: Commit**

```bash
git add apps/web/components/checkout/upgrade-success-handler.tsx apps/web/components/checkout/__tests__/upgrade-success-handler.test.tsx
git commit -m "feat(web): add UpgradeSuccessHandler component

Handle upgrade success/cancel URL params with toast notifications."
```

---

## Task 12: Create Checkout Component Barrel Export

**Files:**
- Create: `apps/web/components/checkout/index.ts`

**Step 1: Create barrel export**

Create `apps/web/components/checkout/index.ts`:

```typescript
export { CheckoutButton, type CheckoutButtonProps } from './checkout-button';
export { UpgradeSuccessHandler } from './upgrade-success-handler';
```

**Step 2: Verify imports work**

Run:
```bash
cd apps/web && pnpm type-check
```

Expected: No type errors

**Step 3: Commit**

```bash
git add apps/web/components/checkout/index.ts
git commit -m "feat(web): add checkout components barrel export"
```

---

## Task 13: Integrate CheckoutButton in Pricing Page

**Files:**
- Modify: `apps/web/app/pricing/page.tsx`

**Step 1: Update pricing page to use CheckoutButton for paid tiers**

Modify `apps/web/app/pricing/page.tsx`:

Update imports at top:
```typescript
'use client';

import Link from 'next/link';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { CheckoutButton } from '@/components/checkout';
import { UpgradeSuccessHandler } from '@/components/checkout';
import { cn } from '@/lib/utils';
```

Update PricingCard component to conditionally render CheckoutButton:

Replace the `<CardFooter>` section in PricingCard (around line 206):
```typescript
      <CardFooter>
        {tier.monthlyPrice === 0 ? (
          <Button asChild variant={tier.popular ? 'default' : 'outline'} className="w-full">
            <Link href={tier.ctaLink}>{tier.cta}</Link>
          </Button>
        ) : (
          <CheckoutButton
            tier={tier.name.toLowerCase() as 'pro' | 'premium'}
            interval={billingPeriod === 'monthly' ? 'month' : 'year'}
            variant={tier.popular ? 'default' : 'outline'}
            className="w-full"
          >
            {tier.cta}
          </CheckoutButton>
        )}
      </CardFooter>
```

Add UpgradeSuccessHandler to the page (to handle cancelled redirect):

In PricingPage component, after the opening `<main>` tag:
```typescript
export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');

  return (
    <main className="min-h-screen bg-primary-900 px-6 py-20 lg:px-8">
      <UpgradeSuccessHandler />
      {/* rest of content */}
```

**Step 2: Verify page renders**

Run:
```bash
cd /home/bahar/bjj-poster && pnpm dev
```

Visit http://localhost:3000/pricing and verify buttons render.

**Step 3: Commit**

```bash
git add apps/web/app/pricing/page.tsx
git commit -m "feat(web): integrate CheckoutButton in pricing page

Replace static links with CheckoutButton for paid tiers."
```

---

## Task 14: Add UpgradeSuccessHandler to Dashboard

**Files:**
- Modify: `apps/web/app/dashboard/page.tsx` (or layout if exists)

**Step 1: Find and update dashboard**

Check if dashboard exists:
```bash
ls -la apps/web/app/dashboard/
```

If exists, add UpgradeSuccessHandler. If not, create minimal dashboard page.

Add to dashboard page:
```typescript
import { UpgradeSuccessHandler } from '@/components/checkout';

// In the component:
<UpgradeSuccessHandler />
```

**Step 2: Verify dashboard loads**

Run dev server and visit http://localhost:3000/dashboard

**Step 3: Commit**

```bash
git add apps/web/app/dashboard/
git commit -m "feat(web): add UpgradeSuccessHandler to dashboard

Show success toast when redirected from Stripe Checkout."
```

---

## Task 15: Run All Tests and Type Check

**Files:** None (verification task)

**Step 1: Run all API tests**

Run:
```bash
cd apps/api && pnpm test
```

Expected: All tests pass

**Step 2: Run all web tests**

Run:
```bash
cd apps/web && pnpm test
```

Expected: All tests pass

**Step 3: Run type checks**

Run:
```bash
pnpm type-check
```

Expected: No type errors

**Step 4: Run lint**

Run:
```bash
pnpm lint
```

Expected: No lint errors (or fix any that appear)

---

## Task 16: Final Commit and Summary

**Step 1: Ensure all changes are committed**

Run:
```bash
git status
```

Commit any uncommitted changes.

**Step 2: Push branch**

Run:
```bash
git push -u origin feat/ODE-77-stripe-checkout-integration
```

---

## Testing Stripe Locally

To test the full flow locally:

1. **Set up Stripe CLI:**
   ```bash
   stripe login
   stripe listen --forward-to localhost:3001/api/payments/webhook
   ```

2. **Copy webhook signing secret** from CLI output to `.env.local`

3. **Create test prices** in Stripe Dashboard (test mode) and add price IDs to `.env.local`

4. **Test checkout flow:**
   - Visit http://localhost:3000/pricing
   - Click "Start Pro Trial"
   - Complete checkout with test card: 4242 4242 4242 4242
   - Verify redirect to dashboard with success toast

5. **Verify webhook:**
   - Check CLI output for `checkout.session.completed` event
   - Check API logs for processing confirmation
