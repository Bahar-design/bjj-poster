import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { APIGatewayProxyEvent, Context } from 'aws-lambda';

// Use vi.hoisted to create mock function before vi.mock hoisting
const { mockConstructEvent } = vi.hoisted(() => ({
  mockConstructEvent: vi.fn(),
}));

// Mock Stripe before importing handler
vi.mock('stripe', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      webhooks: {
        constructEvent: mockConstructEvent,
      },
    })),
  };
});

// Mock db - define the mock inline to avoid hoisting issues
vi.mock('@bjj-poster/db', () => ({
  db: {
    users: {
      updateSubscription: vi.fn().mockResolvedValue(undefined),
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

// Get reference to the mocked function for assertions
const mockUpdateSubscription = vi.mocked(db.users.updateSubscription);

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
    expect(body.message).toContain('Failed to process subscription');
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

    const event = createEvent();

    // First call
    const result1 = await handler(event, mockContext, () => {});
    expect(result1.statusCode).toBe(200);
    expect(mockUpdateSubscription).toHaveBeenCalledTimes(1);

    // Second call with same event ID
    const result2 = await handler(event, mockContext, () => {});
    expect(result2.statusCode).toBe(200);
    const body2 = JSON.parse(result2.body);
    expect(body2.duplicate).toBe(true);

    // db should only be called once
    expect(mockUpdateSubscription).toHaveBeenCalledTimes(1);
  });
});
