#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { HelloLambdaStack } from '../lib/hello-lambda-stack.js';

const app = new cdk.App();

// Get stage from context (default to 'dev')
const stage = app.node.tryGetContext('stage') || 'dev';

// Create the Hello Lambda stack
new HelloLambdaStack(app, `BjjPoster-HelloLambda-${stage}`, {
  stage,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  tags: {
    Project: 'bjj-poster-app',
    Stage: stage,
  },
});
