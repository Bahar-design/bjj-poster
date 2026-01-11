/**
 * Rate Limit Repository
 *
 * Handles rate limiting using DynamoDB with TTL for automatic cleanup.
 */

import { UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import type { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { TABLE_NAME } from '../config.js';

interface RateLimitRecord {
  count: number;
  windowStart: number;
  expiresAt: number;
}

export class RateLimitRepository {
  constructor(private readonly client: DynamoDBDocumentClient) {}

  /**
   * Check if an action is within rate limits and increment counter.
   *
   * @param key - Unique key for rate limiting (e.g., "checkout:user-123")
   * @param limit - Maximum allowed actions in the window
   * @param windowSeconds - Time window in seconds
   * @returns Object with allowed (boolean) and remaining count
   */
  async checkAndIncrement(
    key: string,
    limit: number,
    windowSeconds: number
  ): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - (now % windowSeconds);
    const expiresAt = windowStart + windowSeconds + 60; // Extra 60s buffer for TTL

    // Get current count
    const existing = await this.getRecord(key);

    // If record is from a different window, start fresh
    if (!existing || existing.windowStart !== windowStart) {
      await this.setRecord(key, { count: 1, windowStart, expiresAt });
      return { allowed: true, remaining: limit - 1, resetAt: windowStart + windowSeconds };
    }

    // Check if limit exceeded
    if (existing.count >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: windowStart + windowSeconds,
      };
    }

    // Increment counter
    await this.incrementRecord(key, windowStart, expiresAt);

    return {
      allowed: true,
      remaining: limit - existing.count - 1,
      resetAt: windowStart + windowSeconds,
    };
  }

  private async getRecord(key: string): Promise<RateLimitRecord | null> {
    const result = await this.client.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `RATELIMIT#${key}`,
          SK: 'LIMIT',
        },
      })
    );

    if (!result.Item) {
      return null;
    }

    return {
      count: result.Item.count as number,
      windowStart: result.Item.windowStart as number,
      expiresAt: result.Item.expiresAt as number,
    };
  }

  private async setRecord(key: string, record: RateLimitRecord): Promise<void> {
    const { PutCommand } = await import('@aws-sdk/lib-dynamodb');
    await this.client.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `RATELIMIT#${key}`,
          SK: 'LIMIT',
          entityType: 'RATE_LIMIT',
          ...record,
        },
      })
    );
  }

  private async incrementRecord(
    key: string,
    windowStart: number,
    expiresAt: number
  ): Promise<void> {
    await this.client.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `RATELIMIT#${key}`,
          SK: 'LIMIT',
        },
        UpdateExpression:
          'SET #count = if_not_exists(#count, :zero) + :one, windowStart = :ws, expiresAt = :exp',
        ExpressionAttributeNames: {
          '#count': 'count',
        },
        ExpressionAttributeValues: {
          ':one': 1,
          ':zero': 0,
          ':ws': windowStart,
          ':exp': expiresAt,
        },
      })
    );
  }
}
