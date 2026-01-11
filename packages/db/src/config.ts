export const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'bjj-poster-app';

export const GSI_NAMES = {
  GSI1: 'GSI1',
  /** GSI for looking up users by Stripe subscription ID */
  STRIPE_SUBSCRIPTION: 'StripeSubscriptionIndex',
} as const;
