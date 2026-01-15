#!/bin/bash
set -e

STAGE=${1:-dev}

echo "WARNING: This will destroy all resources in $STAGE environment"
read -p "Are you sure? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "Aborted"
  exit 1
fi

pnpm cdk destroy --all --context stage=$STAGE --force

echo "Destruction complete!"
