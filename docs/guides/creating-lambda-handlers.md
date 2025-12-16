# Creating Lambda Handlers

This guide shows how to create new Lambda handlers for the BJJ Poster App.

## Handler Location

All handlers live in `apps/api/src/handlers/{domain}/{action}.ts`:

```
apps/api/src/handlers/
├── hello/
│   └── index.ts        # GET /api/hello
├── user/
│   ├── get-profile.ts  # GET /api/users/:id
│   └── update-profile.ts
├── poster/
│   ├── create-poster.ts
│   ├── get-poster.ts
│   └── list-posters.ts
└── billing/
    └── stripe-webhook.ts
```

## Step 1: Create the Handler File

```bash
mkdir -p apps/api/src/handlers/your-domain
```

Create `apps/api/src/handlers/your-domain/your-action.ts`:

```typescript
import type { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';

// Define your input/output types
interface YourInput {
  fieldA: string;
  fieldB?: number;
}

interface YourOutput {
  result: string;
  timestamp: string;
}

// Helper to create responses
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

// Helper to parse request body
const parseBody = <T>(body: string | null): T => {
  if (!body) {
    throw new Error('Request body is required');
  }
  return JSON.parse(body) as T;
};

export const handler: APIGatewayProxyHandler = async (event) => {
  const requestId = event.requestContext.requestId;

  console.log('Handler invoked', {
    requestId,
    path: event.path,
    method: event.httpMethod,
  });

  try {
    // For POST/PUT requests, parse the body
    // const input = parseBody<YourInput>(event.body);

    // For GET requests, use query parameters
    // const param = event.queryStringParameters?.param;

    // For path parameters (e.g., /users/:id)
    // const id = event.pathParameters?.id;

    // Get authenticated user (when using Cognito)
    // const userId = event.requestContext.authorizer?.claims?.sub;

    // Your business logic here
    const output: YourOutput = {
      result: 'success',
      timestamp: new Date().toISOString(),
    };

    return createResponse(200, output);

  } catch (error) {
    console.error('Handler failed', { requestId, error });

    if (error instanceof Error && error.message.includes('required')) {
      return createResponse(400, { message: error.message });
    }

    return createResponse(500, { message: 'Internal server error' });
  }
};
```

## Step 2: Add to Local Server

Edit `apps/api/src/local-server.ts`:

```typescript
// Add import at the top
import { handler as yourHandler } from './handlers/your-domain/your-action.js';

// Add route in the routes section
app.get('/api/your-endpoint', lambdaAdapter(yourHandler));
// or for POST:
app.post('/api/your-endpoint', lambdaAdapter(yourHandler));
// or with path parameters:
app.get('/api/items/:id', lambdaAdapter(yourHandler));
```

## Step 3: Test Locally

```bash
# Start the server
cd apps/api
pnpm dev

# Test your endpoint
curl http://localhost:3001/api/your-endpoint
curl -X POST http://localhost:3001/api/your-endpoint \
  -H "Content-Type: application/json" \
  -d '{"fieldA": "value"}'
```

## Step 4: Build

```bash
cd apps/api
pnpm build
```

## Common Patterns

### GET with Query Parameters

```typescript
export const handler: APIGatewayProxyHandler = async (event) => {
  const name = event.queryStringParameters?.name || 'default';
  const limit = parseInt(event.queryStringParameters?.limit || '10');

  // Use name, limit...
};
```

Test: `curl "http://localhost:3001/api/items?name=test&limit=5"`

### GET with Path Parameters

```typescript
export const handler: APIGatewayProxyHandler = async (event) => {
  const id = event.pathParameters?.id;

  if (!id) {
    return createResponse(400, { message: 'ID is required' });
  }

  // Fetch item by id...
};
```

Local server route: `app.get('/api/items/:id', lambdaAdapter(handler));`

Test: `curl http://localhost:3001/api/items/123`

### POST with JSON Body

```typescript
interface CreateItemInput {
  name: string;
  description?: string;
}

export const handler: APIGatewayProxyHandler = async (event) => {
  if (!event.body) {
    return createResponse(400, { message: 'Request body required' });
  }

  const input: CreateItemInput = JSON.parse(event.body);

  if (!input.name) {
    return createResponse(400, { message: 'Name is required' });
  }

  // Create item...
};
```

Test:
```bash
curl -X POST http://localhost:3001/api/items \
  -H "Content-Type: application/json" \
  -d '{"name": "My Item", "description": "Optional"}'
```

### Authenticated Endpoints

The local server mocks a Cognito user. In production, the user comes from the authorizer:

```typescript
export const handler: APIGatewayProxyHandler = async (event) => {
  const userId = event.requestContext.authorizer?.claims?.sub;

  if (!userId) {
    return createResponse(401, { message: 'Unauthorized' });
  }

  // User is authenticated, userId is their Cognito sub
};
```

### Using DynamoDB

```typescript
import { db } from '@bjj-poster/db';

export const handler: APIGatewayProxyHandler = async (event) => {
  const userId = event.requestContext.authorizer?.claims?.sub;

  // Use repository methods
  const posters = await db.posters.listByUserId(userId);

  return createResponse(200, posters);
};
```

### Error Handling with Custom Errors

```typescript
import { ValidationError, NotFoundError, AppError } from '@bjj-poster/core';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // Your logic...

    if (!item) {
      throw new NotFoundError('Item', itemId);
    }

    if (!input.name) {
      throw new ValidationError('Name is required', 'name');
    }

    return createResponse(200, result);

  } catch (error) {
    if (error instanceof AppError) {
      return createResponse(error.statusCode, { message: error.message });
    }

    return createResponse(500, { message: 'Internal server error' });
  }
};
```

## Adding to CDK (for AWS Deployment)

Once your handler works locally, add it to a CDK stack. See `infra/lib/hello-lambda-stack.ts` as an example, or create a new stack for your domain.

## Checklist for New Handlers

- [ ] Create handler file in `apps/api/src/handlers/{domain}/`
- [ ] Define input/output TypeScript interfaces
- [ ] Add request validation
- [ ] Add error handling with try/catch
- [ ] Log with requestId for tracing
- [ ] Add route to `local-server.ts`
- [ ] Test locally with curl
- [ ] Build with `pnpm build`
- [ ] (Optional) Add to CDK stack for AWS deployment
