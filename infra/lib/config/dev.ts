import { EnvironmentConfig } from './types';

export const devConfig: EnvironmentConfig = {
  stage: 'dev',
  region: 'us-east-1',
  account: process.env.CDK_DEFAULT_ACCOUNT!,
  apiDomain: 'api-dev.bjjposter.app',
  webDomain: 'dev.bjjposter.app',
  apiThrottleRate: 100,
  apiThrottleBurst: 200,
  lambdaMemory: 1024,
  lambdaTimeout: 30,
  dynamoDbBillingMode: 'PAY_PER_REQUEST',
  posterBucketName: 'bjj-poster-app-dev-posters',
  cognitoUserPoolName: 'bjj-poster-app-dev',
  enableCdn: false
};
