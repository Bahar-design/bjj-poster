/**
 * User Repository
 *
 * Handles all DynamoDB operations for users.
 * See .claude/skills/dynamodb-operations.md for patterns
 */

import { UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
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
   * Update user subscription after successful Stripe checkout
   */
  async updateSubscription(
    userId: string,
    input: UpdateSubscriptionInput
  ): Promise<void> {
    const now = new Date().toISOString();

    const updateExpression = [
      'SET subscriptionTier = :tier',
      'stripeSubscriptionId = :subId',
      'updatedAt = :updatedAt',
    ];

    const expressionValues: Record<string, unknown> = {
      ':tier': input.tier,
      ':subId': input.stripeSubscriptionId,
      ':updatedAt': now,
    };

    if (input.stripeCustomerId) {
      updateExpression.push('stripeCustomerId = :custId');
      expressionValues[':custId'] = input.stripeCustomerId;
    }

    await this.client.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: 'PROFILE',
        },
        UpdateExpression: updateExpression.join(', '),
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
