/**
 * User Repository
 *
 * Handles all DynamoDB operations for users.
 * See .claude/skills/dynamodb-operations.md for patterns
 */

import { UpdateCommand, GetCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import type { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { TABLE_NAME } from '../config.js';
import type {
  User,
  UserItem,
  UpdateSubscriptionInput,
} from '../entities/user.js';

export class UserRepository {
  constructor(private readonly client: DynamoDBDocumentClient) {}

  /**
   * Get a user by ID
   */
  async getById(userId: string): Promise<User | null> {
    const result = await this.client.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: 'PROFILE',
        },
      })
    );

    if (!result.Item) {
      return null;
    }

    return this.toEntity(result.Item as UserItem);
  }

  /**
   * Get a user by their Stripe subscription ID.
   *
   * Note: This uses a scan with filter, which works for small-medium tables
   * but should be replaced with a GSI query for larger scale.
   * TODO: Add StripeSubscriptionIndex GSI for O(1) lookups.
   *
   * @param stripeSubscriptionId - The Stripe subscription ID
   * @returns The user if found, null otherwise
   */
  async getByStripeSubscriptionId(
    stripeSubscriptionId: string
  ): Promise<User | null> {
    const result = await this.client.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression:
          'SK = :sk AND stripeSubscriptionId = :subId',
        ExpressionAttributeValues: {
          ':sk': 'PROFILE',
          ':subId': stripeSubscriptionId,
        },
        Limit: 1,
      })
    );

    if (!result.Items || result.Items.length === 0) {
      return null;
    }

    return this.toEntity(result.Items[0] as UserItem);
  }

  /**
   * Update user subscription after successful Stripe checkout.
   *
   * This is an upsert-style operation that updates the subscription fields
   * on an existing user record. The operation is idempotent - calling it
   * multiple times with the same input will produce the same result.
   *
   * @param userId - The Cognito user ID (sub claim)
   * @param input - Subscription details including tier, Stripe IDs.
   *                Pass null for stripeSubscriptionId to clear it (on cancellation).
   * @throws Error if DynamoDB update fails
   *
   * @example
   * ```typescript
   * // Upgrade to pro
   * await db.users.updateSubscription('user-123', {
   *   tier: 'pro',
   *   stripeSubscriptionId: 'sub_xxx',
   *   stripeCustomerId: 'cus_xxx',
   * });
   *
   * // Downgrade to free (subscription cancelled)
   * await db.users.updateSubscription('user-123', {
   *   tier: 'free',
   *   stripeSubscriptionId: null,
   * });
   * ```
   */
  async updateSubscription(
    userId: string,
    input: UpdateSubscriptionInput
  ): Promise<void> {
    const now = new Date().toISOString();

    const setExpressions = ['subscriptionTier = :tier', 'updatedAt = :updatedAt'];
    const removeExpressions: string[] = [];

    const expressionValues: Record<string, unknown> = {
      ':tier': input.tier,
      ':updatedAt': now,
    };

    // Handle stripeSubscriptionId: SET if value provided, REMOVE if null
    if (input.stripeSubscriptionId !== null) {
      setExpressions.push('stripeSubscriptionId = :subId');
      expressionValues[':subId'] = input.stripeSubscriptionId;
    } else {
      removeExpressions.push('stripeSubscriptionId');
    }

    if (input.stripeCustomerId) {
      setExpressions.push('stripeCustomerId = :custId');
      expressionValues[':custId'] = input.stripeCustomerId;
    }

    // Build UpdateExpression: SET ... REMOVE ...
    let updateExpression = `SET ${setExpressions.join(', ')}`;
    if (removeExpressions.length > 0) {
      updateExpression += ` REMOVE ${removeExpressions.join(', ')}`;
    }

    await this.client.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: 'PROFILE',
        },
        UpdateExpression: updateExpression,
        ExpressionAttributeValues: expressionValues,
      })
    );
  }

  /**
   * Convert DynamoDB item to public entity
   */
  private toEntity(item: UserItem): User {
    return {
      userId: item.userId,
      email: item.email,
      name: item.name,
      subscriptionTier: item.subscriptionTier,
      stripeCustomerId: item.stripeCustomerId,
      stripeSubscriptionId: item.stripeSubscriptionId,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}
