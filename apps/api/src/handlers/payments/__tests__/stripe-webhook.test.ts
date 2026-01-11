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
          metadata: { tier: 'pro' },
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
