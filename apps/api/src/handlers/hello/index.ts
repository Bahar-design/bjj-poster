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
