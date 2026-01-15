import { EnvironmentConfig } from './types';

export const prodConfig: EnvironmentConfig = {
  stage: 'prod',
  region: 'us-east-1',
  account: process.env.CDK_DEFAULT_ACCOUNT!,
  apiDomain: 'api.bjjposter.app',
  webDomain: 'bjjposter.app',
  apiThrottleRate: 1000,
  apiThrottleBurst: 2000,
  lambdaMemory: 2048,
  lambdaTimeout: 30,
  dynamoDbBillingMode: 'PAY_PER_REQUEST',
  posterBucketName: 'bjj-poster-app-prod-posters',
  cognitoUserPoolName: 'bjj-poster-app-prod',
  enableCdn: true
};
