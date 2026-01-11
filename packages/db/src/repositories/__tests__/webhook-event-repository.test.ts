import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WebhookEventRepository } from '../webhook-event-repository.js';

// Mock the DynamoDB client
const mockSend = vi.fn();
const mockClient = {
  send: mockSend,
};

describe('WebhookEventRepository', () => {
  let repository: WebhookEventRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new WebhookEventRepository(mockClient as any);
  });

  describe('getById', () => {
    it('returns null when event does not exist', async () => {
      mockSend.mockResolvedValueOnce({ Item: null });

      const result = await repository.getById('evt_123');

      expect(result).toBeNull();
    });

    it('returns event when it exists', async () => {
      mockSend.mockResolvedValueOnce({
        Item: {
          PK: 'WEBHOOK#evt_123',
          SK: 'EVENT',
          entityType: 'WEBHOOK_EVENT',
          eventId: 'evt_123',
          eventType: 'checkout.session.completed',
          processedAt: '2024-01-01T00:00:00.000Z',
          expiresAt: 1704153600,
        },
      });

      const result = await repository.getById('evt_123');

      expect(result).toEqual({
        eventId: 'evt_123',
        eventType: 'checkout.session.completed',
        processedAt: '2024-01-01T00:00:00.000Z',
        expiresAt: 1704153600,
      });
    });
  });

  describe('checkAndMark', () => {
    it('returns false (not duplicate) when event is new', async () => {
      mockSend.mockResolvedValueOnce({});

      const result = await repository.checkAndMark('evt_new', 'checkout.session.completed');

      expect(result).toBe(false);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            ConditionExpression: 'attribute_not_exists(PK)',
          }),
        })
      );
    });

    it('returns true (duplicate) when event already exists', async () => {
      const error = new Error('Conditional check failed');
      error.name = 'ConditionalCheckFailedException';
      mockSend.mockRejectedValueOnce(error);

      const result = await repository.checkAndMark('evt_duplicate', 'checkout.session.completed');

      expect(result).toBe(true);
    });

    it('rethrows non-conditional errors', async () => {
      const error = new Error('DynamoDB error');
      error.name = 'ServiceException';
      mockSend.mockRejectedValueOnce(error);

      await expect(
        repository.checkAndMark('evt_error', 'checkout.session.completed')
      ).rejects.toThrow('DynamoDB error');
    });
  });

  describe('remove', () => {
    it('removes event from idempotency cache', async () => {
      mockSend.mockResolvedValueOnce({});

      await repository.remove('evt_123');

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            Key: {
              PK: 'WEBHOOK#evt_123',
              SK: 'EVENT',
            },
          }),
        })
      );
    });
  });
});
