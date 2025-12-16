import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface HelloLambdaStackProps extends cdk.StackProps {
  stage: string;
}

export class HelloLambdaStack extends cdk.Stack {
  public readonly apiUrl: cdk.CfnOutput;

  constructor(scope: Construct, id: string, props: HelloLambdaStackProps) {
    super(scope, id, props);

    const { stage } = props;

    // Create the Lambda function
    const helloFunction = new lambda.Function(this, 'HelloFunction', {
      functionName: `bjj-poster-hello-${stage}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(
        path.join(__dirname, '../../apps/api/dist')
      ),
      memorySize: 256,
      timeout: cdk.Duration.seconds(10),
      environment: {
        NODE_ENV: stage === 'prod' ? 'production' : 'development',
        STAGE: stage,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      description: 'Simple hello world Lambda for learning AWS deployment',
    });

    // Create API Gateway REST API
    const api = new apigateway.RestApi(this, 'HelloApi', {
      restApiName: `bjj-poster-hello-api-${stage}`,
      description: 'API Gateway for Hello Lambda',
      deployOptions: {
        stageName: stage,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    // Create /hello resource and GET method
    const helloResource = api.root.addResource('hello');
    helloResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(helloFunction, {
        requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
      })
    );

    // Output the API URL
    this.apiUrl = new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'URL of the Hello API',
      exportName: `BjjPoster-HelloApiUrl-${stage}`,
    });

    // Output the Lambda function name
    new cdk.CfnOutput(this, 'FunctionName', {
      value: helloFunction.functionName,
      description: 'Name of the Hello Lambda function',
    });
  }
}
