/**
 * Webhook Event Repository
 *
 * Handles idempotency tracking for Stripe webhook events.
 * Uses DynamoDB with TTL for automatic cleanup of old records.
 */

import { PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import type { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { TABLE_NAME } from '../config.js';
import type { WebhookEvent, WebhookEventItem } from '../entities/webhook-event.js';

// TTL: 48 hours in seconds
const TTL_SECONDS = 48 * 60 * 60;

export class WebhookEventRepository {
  constructor(private readonly client: DynamoDBDocumentClient) {}

  /**
   * Check if an event has already been processed.
   * Returns the event if it exists, null otherwise.
   */
  async getById(eventId: string): Promise<WebhookEvent | null> {
    const result = await this.client.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `WEBHOOK#${eventId}`,
          SK: 'EVENT',
        },
      })
    );

    if (!result.Item) {
      return null;
    }

    return this.toEntity(result.Item as WebhookEventItem);
  }

  /**
   * Check if an event has been processed and mark it if not.
   * Returns true if the event was already processed (duplicate).
   * Returns false if this is the first time processing the event.
   *
   * This is an atomic operation using DynamoDB conditional writes.
   */
  async checkAndMark(eventId: string, eventType: string): Promise<boolean> {
    const now = new Date();
    const expiresAt = Math.floor(now.getTime() / 1000) + TTL_SECONDS;

    const item: WebhookEventItem = {
      PK: `WEBHOOK#${eventId}`,
      SK: 'EVENT',
      entityType: 'WEBHOOK_EVENT',
      eventId,
      eventType,
      processedAt: now.toISOString(),
      expiresAt,
    };

    try {
      await this.client.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: item,
          // Only succeed if the item doesn't already exist
          ConditionExpression: 'attribute_not_exists(PK)',
        })
      );
      // Successfully marked as processing - this is NOT a duplicate
      return false;
    } catch (error) {
      // Check if the error is a conditional check failure (duplicate)
      if (
        error instanceof Error &&
        error.name === 'ConditionalCheckFailedException'
      ) {
        return true; // Duplicate event
      }
      // Re-throw other errors
      throw error;
    }
  }

  /**
   * Remove an event from the idempotency cache.
   * Used when processing fails and we want Stripe to retry.
   */
  async remove(eventId: string): Promise<void> {
    const { DeleteCommand } = await import('@aws-sdk/lib-dynamodb');
    await this.client.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `WEBHOOK#${eventId}`,
          SK: 'EVENT',
        },
      })
    );
  }

  /**
   * Convert DynamoDB item to public entity
   */
  private toEntity(item: WebhookEventItem): WebhookEvent {
    return {
      eventId: item.eventId,
      eventType: item.eventType,
      processedAt: item.processedAt,
      expiresAt: item.expiresAt,
    };
  }
}
