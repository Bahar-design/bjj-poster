#!/bin/bash
set -e

STAGE=${1:-dev}

echo "Deploying to $STAGE environment..."

# Build TypeScript
pnpm build

# Deploy all stacks
pnpm cdk deploy --all --context stage=$STAGE --require-approval never

echo "Deployment complete!"
echo "API URL: $(pnpm cdk output BjjPosterApi-$STAGE.ApiUrl --context stage=$STAGE)"
