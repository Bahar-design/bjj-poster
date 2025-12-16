# Lambda Deployment Guide

This guide walks through creating a Lambda function, testing it locally, and deploying it to AWS using CDK.

## Prerequisites

- Node.js 20+ and pnpm 9+
- Docker Desktop (for CDK asset bundling)
- AWS CLI v2 installed
- AWS account with IAM user credentials

## Part 1: Create the Lambda Handler

### Step 1.1: Create the Handler Directory

```bash
mkdir -p apps/api/src/handlers/hello
```

### Step 1.2: Write the Handler Code

Create `apps/api/src/handlers/hello/index.ts`:

```typescript
import type { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';

interface HelloResponse {
  message: string;
  timestamp: string;
  requestId: string;
}

const createResponse = (
  statusCode: number,
  body: unknown
): APIGatewayProxyResult => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  },
  body: JSON.stringify(body),
});

export const handler: APIGatewayProxyHandler = async (event) => {
  const requestId = event.requestContext.requestId;
  const name = event.queryStringParameters?.name || 'World';

  console.log('Hello handler invoked', { requestId, name });

  const response: HelloResponse = {
    message: `Hello, ${name}! Welcome to BJJ Poster App.`,
    timestamp: new Date().toISOString(),
    requestId,
  };

  return createResponse(200, response);
};
```

### Step 1.3: Register the Handler in Local Server

Edit `apps/api/src/local-server.ts`:

```typescript
// Add import at the top
import { handler as helloHandler } from './handlers/hello/index.js';

// Add route in the routes section
app.get('/api/hello', lambdaAdapter(helloHandler));
```

## Part 2: Test Locally

### Step 2.1: Start the Local Server

```bash
cd apps/api
pnpm dev
```

### Step 2.2: Test the Endpoint

```bash
# Basic request
curl http://localhost:3001/api/hello

# With query parameter
curl "http://localhost:3001/api/hello?name=YourName"
```

Expected response:
```json
{
  "message": "Hello, YourName! Welcome to BJJ Poster App.",
  "timestamp": "2025-12-16T13:44:22.939Z",
  "requestId": "local-1234567890"
}
```

## Part 3: Set Up AWS Credentials

### Step 3.1: Create an IAM User (if needed)

1. Go to AWS Console → IAM → Users → Create User
2. Name it (e.g., `bjj-poster-dev`)
3. Attach the policy `AdministratorAccess` (for development)
4. Go to Security credentials → Create access key → CLI
5. Save the Access Key ID and Secret Access Key

### Step 3.2: Configure AWS CLI

```bash
aws configure
```

Enter when prompted:
```
AWS Access Key ID: YOUR_ACCESS_KEY
AWS Secret Access Key: YOUR_SECRET_KEY
Default region name: us-east-1
Default output format: json
```

### Step 3.3: Verify Credentials

```bash
aws sts get-caller-identity
```

Expected output:
```json
{
    "UserId": "AIDA...",
    "Account": "123456789012",
    "Arn": "arn:aws:iam::123456789012:user/bjj-poster-dev"
}
```

## Part 4: Bootstrap CDK (First Time Only)

CDK needs an S3 bucket and IAM roles in your AWS account:

```bash
cd infra
pnpm cdk bootstrap
```

This creates a `CDKToolkit` CloudFormation stack. You only need to do this once per AWS account/region.

## Part 5: Build the Lambda Code

**Important:** Lambda expects CommonJS format, not ESM.

```bash
cd apps/api
pnpm build
```

This compiles TypeScript to JavaScript in `apps/api/dist/`.

Verify the build:
```bash
ls dist/
# Should show: index.js
```

## Part 6: Preview the Deployment

See what CDK will create:

```bash
cd infra
pnpm cdk diff --context stage=dev
```

This shows:
- IAM roles (for Lambda execution)
- Lambda function
- API Gateway REST API
- CloudWatch log group

## Part 7: Deploy to AWS

```bash
cd infra
pnpm cdk deploy --context stage=dev
```

CDK will:
1. Package your code into a ZIP file
2. Upload it to the CDK S3 bucket
3. Create/update CloudFormation stack
4. Output the API URL

Example output:
```
Outputs:
BjjPoster-HelloLambda-dev.ApiUrl = https://abc123xyz.execute-api.us-east-1.amazonaws.com/dev/
BjjPoster-HelloLambda-dev.FunctionName = bjj-poster-hello-dev
```

## Part 8: Test the Live Lambda

```bash
# Replace with your actual API URL from the deployment output
curl https://abc123xyz.execute-api.us-east-1.amazonaws.com/dev/hello

curl "https://abc123xyz.execute-api.us-east-1.amazonaws.com/dev/hello?name=BJJ"
```

## Part 9: View Logs

```bash
# Stream logs in real-time
aws logs tail /aws/lambda/bjj-poster-hello-dev --follow

# View recent logs
aws logs tail /aws/lambda/bjj-poster-hello-dev --since 10m
```

Or use AWS Console: CloudWatch → Log groups → `/aws/lambda/bjj-poster-hello-dev`

## Part 10: Update and Redeploy

When you change your handler code:

```bash
# 1. Rebuild
cd apps/api && pnpm build

# 2. Redeploy
cd ../infra && pnpm cdk deploy --context stage=dev
```

## Part 11: Cleanup (Remove AWS Resources)

To delete all AWS resources created by this stack:

```bash
cd infra
pnpm cdk destroy --context stage=dev
```

Type `y` to confirm. This removes:
- Lambda function
- API Gateway
- IAM roles
- CloudWatch log group

---

## Quick Reference

### Common Commands

| Task | Command |
|------|---------|
| Test locally | `cd apps/api && pnpm dev` |
| Build | `cd apps/api && pnpm build` |
| Preview changes | `cd infra && pnpm cdk diff --context stage=dev` |
| Deploy | `cd infra && pnpm cdk deploy --context stage=dev` |
| View logs | `aws logs tail /aws/lambda/bjj-poster-hello-dev --follow` |
| Destroy | `cd infra && pnpm cdk destroy --context stage=dev` |

### Full Deploy Workflow

```bash
# From project root
cd apps/api && pnpm build && cd ../infra && pnpm cdk deploy --context stage=dev
```

---

## Troubleshooting

### "Unable to locate credentials"

AWS CLI is not configured:
```bash
aws configure
```

### "CDK bootstrap required" or "Policy contains a statement with one or more invalid principals"

Run bootstrap in your target account/region:
```bash
cd infra && pnpm cdk bootstrap
```

### "Internal server error" after deploy

Check Lambda logs for the actual error:
```bash
aws logs tail /aws/lambda/bjj-poster-hello-dev --since 5m
```

Common causes:
- **"Unexpected token 'export'"**: Code is ESM but Lambda expects CommonJS. Ensure build uses `--format cjs`
- **"Cannot find module"**: Handler path is wrong in CDK stack
- **"Task timed out"**: Lambda timeout too short or code has infinite loop

### Handler not found

Ensure:
1. `apps/api` is built (`pnpm build`)
2. Handler exports `handler` function (not default export)
3. CDK `handler` property matches: `index.handler` = file `index.js`, export `handler`

### CORS errors in browser

The handler includes CORS headers, but check:
- `Access-Control-Allow-Origin` header is in the response
- API Gateway has CORS configured (our CDK stack does this)

---

## Understanding the CDK Stack

The CDK stack (`infra/lib/hello-lambda-stack.ts`) creates:

```
┌─────────────────────────────────────────────────────────┐
│                    API Gateway                          │
│  https://xxx.execute-api.us-east-1.amazonaws.com/dev/  │
└─────────────────────┬───────────────────────────────────┘
                      │ /hello (GET)
                      ▼
┌─────────────────────────────────────────────────────────┐
│                  Lambda Function                        │
│  bjj-poster-hello-dev                                  │
│  Runtime: Node.js 20.x                                 │
│  Handler: index.handler                                │
└─────────────────────┬───────────────────────────────────┘
                      │ logs
                      ▼
┌─────────────────────────────────────────────────────────┐
│                  CloudWatch Logs                        │
│  /aws/lambda/bjj-poster-hello-dev                      │
│  Retention: 7 days                                     │
└─────────────────────────────────────────────────────────┘
```

Key CDK concepts:
- **Stack**: Unit of deployment (becomes a CloudFormation stack)
- **Construct**: Cloud component (Lambda, API Gateway, etc.)
- **Props**: Configuration passed to constructs
- **CfnOutput**: Values displayed after deployment
