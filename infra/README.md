# BJJ Poster App Infrastructure

AWS CDK infrastructure for the BJJ Poster App.

## Prerequisites

- AWS CLI configured
- Node.js 20+
- pnpm

## Setup

```bash
cd infra
pnpm install
pnpm build
```

## Bootstrap (First Time Only)

```bash
pnpm cdk bootstrap --context stage=dev
pnpm cdk bootstrap --context stage=prod
```

## Deploy

### Dev Environment
```bash
./scripts/deploy.sh dev
```

### Prod Environment
```bash
./scripts/deploy.sh prod
```

## Stacks

- **DatabaseStack**: DynamoDB single-table design
- **StorageStack**: S3 buckets for posters
- **ApiStack**: API Gateway + Lambda functions
- **CdnStack**: CloudFront distribution (prod only)

## CloudFront CDN (Production Only)

The CDN stack is only deployed in production and serves:
- Frontend application assets (HTML, CSS, JS)
- Generated poster images from S3

### Custom Domain Setup

1. Request ACM certificate in us-east-1 for your domain
2. Update `infra/lib/cdn-stack.ts` with certificate ARN
3. Uncomment `domainNames` and `certificate` lines
4. Deploy: `./scripts/deploy.sh prod`
5. Update DNS to point to CloudFront distribution domain

## Outputs

After deployment, get stack outputs:

```bash
pnpm cdk output --all --context stage=dev
```
