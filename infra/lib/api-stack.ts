import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { EnvironmentConfig } from './config/types';
import * as path from 'path';

export class ApiStack extends cdk.Stack {
  public readonly api: apigateway.RestApi;

  constructor(
    scope: Construct,
    id: string,
    config: EnvironmentConfig,
    table: dynamodb.Table,
    posterBucket: s3.Bucket,
    props?: cdk.StackProps
  ) {
    super(scope, id, props);

    this.api = new apigateway.RestApi(this, 'Api', {
      restApiName: `bjj-poster-app-${config.stage}`,
      description: `BJJ Poster App API (${config.stage})`,
      deployOptions: {
        stageName: config.stage,
        throttlingRateLimit: config.apiThrottleRate,
        throttlingBurstLimit: config.apiThrottleBurst,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: config.stage === 'dev',
        metricsEnabled: true
      },
      defaultCorsPreflightOptions: {
        allowOrigins: config.stage === 'dev'
          ? ['http://localhost:3000', `https://${config.webDomain}`]
          : [`https://${config.webDomain}`],
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'Authorization']
      }
    });

    const commonEnv = {
      TABLE_NAME: table.tableName,
      POSTER_BUCKET_NAME: posterBucket.bucketName,
      STAGE: config.stage
    };

    // Generate Poster Lambda
    const generatePosterFn = new nodejs.NodejsFunction(this, 'GeneratePoster', {
      entry: path.join(__dirname, '../../apps/api/src/handlers/posters/generate-poster.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: config.lambdaMemory,
      timeout: cdk.Duration.seconds(config.lambdaTimeout),
      environment: commonEnv
    });

    table.grantReadWriteData(generatePosterFn);
    posterBucket.grantReadWrite(generatePosterFn);

    // Get Templates Lambda
    const getTemplatesFn = new nodejs.NodejsFunction(this, 'GetTemplates', {
      entry: path.join(__dirname, '../../apps/api/src/handlers/templates/get-templates.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 512,
      timeout: cdk.Duration.seconds(10),
      environment: commonEnv
    });

    table.grantReadData(getTemplatesFn);

    // Get User Posters Lambda
    const getUserPostersFn = new nodejs.NodejsFunction(this, 'GetUserPosters', {
      entry: path.join(__dirname, '../../apps/api/src/handlers/posters/get-user-posters.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 512,
      timeout: cdk.Duration.seconds(10),
      environment: commonEnv
    });

    table.grantReadData(getUserPostersFn);

    // Get User Profile Lambda
    const getUserProfileFn = new nodejs.NodejsFunction(this, 'GetUserProfile', {
      entry: path.join(__dirname, '../../apps/api/src/handlers/user/get-profile.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 256,
      timeout: cdk.Duration.seconds(10),
      environment: commonEnv
    });

    table.grantReadWriteData(getUserProfileFn);

    // API Routes
    const posters = this.api.root.addResource('posters');
    posters.addMethod('POST', new apigateway.LambdaIntegration(generatePosterFn));
    posters.addMethod('GET', new apigateway.LambdaIntegration(getUserPostersFn));

    const templates = this.api.root.addResource('templates');
    templates.addMethod('GET', new apigateway.LambdaIntegration(getTemplatesFn));

    const user = this.api.root.addResource('user');
    const profile = user.addResource('profile');
    profile.addMethod('GET', new apigateway.LambdaIntegration(getUserProfileFn));

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: this.api.url,
      exportName: `${config.stage}-ApiUrl`
    });
  }
}
