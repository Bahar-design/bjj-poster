import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { APIGatewayProxyEvent, Context } from 'aws-lambda';

// Use vi.hoisted to create mock functions before vi.mock hoisting
const { mockConstructEvent, mockSubscriptionsRetrieve } = vi.hoisted(() => ({
  mockConstructEvent: vi.fn(),
  mockSubscriptionsRetrieve: vi.fn(),
}));

// Mock Stripe before importing handler
vi.mock('stripe', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      webhooks: {
        constructEvent: mockConstructEvent,
      },
      subscriptions: {
        retrieve: mockSubscriptionsRetrieve,
      },
    })),
  };
});

// Mock db - define the mock inline to avoid hoisting issues
vi.mock('@bjj-poster/db', () => ({
  db: {
    users: {
      updateSubscription: vi.fn().mockResolvedValue(undefined),
      getByStripeSubscriptionId: vi.fn().mockResolvedValue(null),
    },
    webhookEvents: {
      checkAndMark: vi.fn().mockResolvedValue(false), // Not a duplicate by default
      remove: vi.fn().mockResolvedValue(undefined),
    },
  },
}));

// Mock price config
vi.mock('../price-config.js', () => ({
  getTierFromPriceId: vi.fn().mockReturnValue('pro'),
}));

// Import after mocks
import { handler } from '../stripe-webhook.js';
import { db } from '@bjj-poster/db';

// Get reference to the mocked functions for assertions
const mockUpdateSubscription = vi.mocked(db.users.updateSubscription);
const mockCheckAndMark = vi.mocked(db.webhookEvents.checkAndMark);
const mockRemoveEvent = vi.mocked(db.webhookEvents.remove);

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
  });

  it('processes checkout.session.completed event', async () => {
    mockConstructEvent.mockReturnValue({
      id: 'evt_test_123',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_123',
          client_reference_id: 'user-123',
          subscription: 'sub_123',
          customer: 'cus_123',
          metadata: { tier: 'pro' },
        },
      },
    });

    const event = createEvent();
    const result = await handler(event, mockContext, () => {});

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.received).toBe(true);

    // Verify db update was called
    expect(mockUpdateSubscription).toHaveBeenCalledWith('user-123', {
      tier: 'pro',
      stripeSubscriptionId: 'sub_123',
      stripeCustomerId: 'cus_123',
    });
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
      id: 'evt_test_456',
      type: 'customer.updated',
      data: { object: {} },
    });

    const event = createEvent();
    const result = await handler(event, mockContext, () => {});

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.received).toBe(true);

    // db should not be called for non-checkout events
    expect(mockUpdateSubscription).not.toHaveBeenCalled();
  });

  it('returns 500 when db update fails', async () => {
    mockConstructEvent.mockReturnValue({
      id: 'evt_test_789',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_123',
          client_reference_id: 'user-123',
          subscription: 'sub_123',
          customer: 'cus_123',
          metadata: { tier: 'pro' },
        },
      },
    });

    mockUpdateSubscription.mockRejectedValueOnce(new Error('DynamoDB error'));

    const event = createEvent();
    const result = await handler(event, mockContext, () => {});

    expect(result.statusCode).toBe(500);
    const body = JSON.parse(result.body);
    expect(body.message).toContain('Failed to process webhook');
  });

  it('skips duplicate events (idempotency)', async () => {
    mockConstructEvent.mockReturnValue({
      id: 'evt_duplicate_test',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_123',
          client_reference_id: 'user-123',
          subscription: 'sub_123',
          customer: 'cus_123',
          metadata: { tier: 'pro' },
        },
      },
    });

    // Simulate duplicate detection from DynamoDB
    mockCheckAndMark.mockResolvedValueOnce(true);

    const event = createEvent();
    const result = await handler(event, mockContext, () => {});

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.duplicate).toBe(true);

    // db should not be called for duplicates
    expect(mockUpdateSubscription).not.toHaveBeenCalled();
  });

  it('returns 500 when client_reference_id is missing', async () => {
    mockConstructEvent.mockReturnValue({
      id: 'evt_no_user',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_123',
          client_reference_id: null,
          subscription: 'sub_123',
          customer: 'cus_123',
          metadata: { tier: 'pro' },
        },
      },
    });

    const event = createEvent();
    const result = await handler(event, mockContext, () => {});

    // Validation errors are caught and returned as 500 (allows Stripe retry)
    expect(result.statusCode).toBe(500);
    const body = JSON.parse(result.body);
    expect(body.code).toBe('PROCESSING_ERROR');
    // Event should be removed from idempotency cache
    expect(mockRemoveEvent).toHaveBeenCalledWith('evt_no_user');
  });

  it('returns 500 when subscription ID is missing', async () => {
    mockConstructEvent.mockReturnValue({
      id: 'evt_no_sub',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_123',
          client_reference_id: 'user-123',
          subscription: null,
          customer: 'cus_123',
          metadata: { tier: 'pro' },
        },
      },
    });

    const event = createEvent();
    const result = await handler(event, mockContext, () => {});

    expect(result.statusCode).toBe(500);
    const body = JSON.parse(result.body);
    expect(body.code).toBe('PROCESSING_ERROR');
    expect(mockRemoveEvent).toHaveBeenCalledWith('evt_no_sub');
  });

  it('returns 500 when customer ID is missing', async () => {
    mockConstructEvent.mockReturnValue({
      id: 'evt_no_cust',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_123',
          client_reference_id: 'user-123',
          subscription: 'sub_123',
          customer: null,
          metadata: { tier: 'pro' },
        },
      },
    });

    const event = createEvent();
    const result = await handler(event, mockContext, () => {});

    expect(result.statusCode).toBe(500);
    const body = JSON.parse(result.body);
    expect(body.code).toBe('PROCESSING_ERROR');
    expect(mockRemoveEvent).toHaveBeenCalledWith('evt_no_cust');
  });

  it('returns 500 when tier cannot be determined', async () => {
    // Import the mocked getTierFromPriceId to control it
    const { getTierFromPriceId } = await import('../price-config.js');
    const mockGetTier = vi.mocked(getTierFromPriceId);

    mockConstructEvent.mockReturnValue({
      id: 'evt_no_tier',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_123',
          client_reference_id: 'user-123',
          subscription: 'sub_123',
          customer: 'cus_123',
          metadata: {}, // No tier in metadata
        },
      },
    });

    // Mock subscription retrieve to return a subscription without tier
    mockSubscriptionsRetrieve.mockResolvedValueOnce({
      items: { data: [{ price: { id: 'price_unknown' } }] },
    });

    // getTierFromPriceId returns null for unknown price
    mockGetTier.mockReturnValueOnce(null);

    const event = createEvent();
    const result = await handler(event, mockContext, () => {});

    expect(result.statusCode).toBe(500);
    const body = JSON.parse(result.body);
    expect(body.code).toBe('PROCESSING_ERROR');

    // Should remove from idempotency cache so Stripe can retry
    expect(mockRemoveEvent).toHaveBeenCalledWith('evt_no_tier');
  });

  it('removes event from idempotency cache on db failure', async () => {
    mockConstructEvent.mockReturnValue({
      id: 'evt_db_fail',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_123',
          client_reference_id: 'user-123',
          subscription: 'sub_123',
          customer: 'cus_123',
          metadata: { tier: 'pro' },
        },
      },
    });

    mockUpdateSubscription.mockRejectedValueOnce(new Error('DynamoDB error'));

    const event = createEvent();
    const result = await handler(event, mockContext, () => {});

    expect(result.statusCode).toBe(500);

    // Should remove from idempotency cache so Stripe can retry
    expect(mockRemoveEvent).toHaveBeenCalledWith('evt_db_fail');
  });

  it('returns 500 if idempotency check fails', async () => {
    mockConstructEvent.mockReturnValue({
      id: 'evt_idemp_fail',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_123',
          client_reference_id: 'user-123',
          subscription: 'sub_123',
          customer: 'cus_123',
          metadata: { tier: 'pro' },
        },
      },
    });

    // Idempotency check throws
    mockCheckAndMark.mockRejectedValueOnce(new Error('DynamoDB error'));

    const event = createEvent();
    const result = await handler(event, mockContext, () => {});

    // Should return 500 to prevent duplicate processing (PR review fix #3)
    expect(result.statusCode).toBe(500);
    const body = JSON.parse(result.body);
    expect(body.code).toBe('IDEMPOTENCY_ERROR');

    // Should not process the event
    expect(mockUpdateSubscription).not.toHaveBeenCalled();
  });

  it('handles base64 encoded body from API Gateway', async () => {
    const bodyContent = JSON.stringify({ type: 'checkout.session.completed' });
    const base64Body = Buffer.from(bodyContent).toString('base64');

    mockConstructEvent.mockReturnValue({
      id: 'evt_base64_test',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_123',
          client_reference_id: 'user-123',
          subscription: 'sub_123',
          customer: 'cus_123',
          metadata: { tier: 'pro' },
        },
      },
    });

    const event = createEvent({
      body: base64Body,
      isBase64Encoded: true,
    });

    const result = await handler(event, mockContext, () => {});

    expect(result.statusCode).toBe(200);
    expect(mockUpdateSubscription).toHaveBeenCalled();
  });
});
