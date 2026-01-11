/**
 * Webhook Event Entity Types
 *
 * Used for idempotency tracking of Stripe webhook events.
 * Key pattern: PK=WEBHOOK#<eventId>, SK=EVENT
 * TTL: 48 hours from processing time
 */

export interface WebhookEvent {
  eventId: string;
  eventType: string;
  processedAt: string;
  expiresAt: number; // Unix timestamp for DynamoDB TTL
}

/**
 * DynamoDB item structure for WebhookEvent
 */
export interface WebhookEventItem {
  PK: string; // WEBHOOK#<eventId>
  SK: string; // EVENT
  entityType: 'WEBHOOK_EVENT';
  eventId: string;
  eventType: string;
  processedAt: string;
  expiresAt: number; // TTL attribute
}
