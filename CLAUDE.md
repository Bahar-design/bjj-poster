# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

```bash
pnpm dev              # Start all apps (web: 3000, api: 3001)
pnpm build            # Build all packages
pnpm test             # Run all tests
pnpm test:integration # Run integration tests with LocalStack
pnpm lint             # Lint code
pnpm lint:fix         # Auto-fix lint issues
pnpm type-check       # TypeScript type checking

# LocalStack (local AWS services)
pnpm localstack:up    # Start LocalStack container
pnpm localstack:down  # Stop LocalStack
pnpm localstack:reset # Reset all LocalStack data

# CDK deployment (from infra/ directory)
cd infra && pnpm cdk deploy --all --context stage=dev
```

## Architecture

This is a monorepo using pnpm workspaces and Turborepo for a serverless BJJ tournament poster generator.

### Workspace Structure

- `apps/api/` - Lambda handlers served locally via Express adapter (`local-server.ts`)
- `apps/web/` - Next.js 14 frontend (not yet scaffolded)
- `packages/core/` - Shared utilities: logger, error classes (`AppError`, `ValidationError`, etc.), types
- `packages/db/` - DynamoDB client and repositories (single-table design)
- `packages/ui/` - Shared React components (not yet scaffolded)
- `packages/config/` - Shared ESLint configs
- `infra/` - AWS CDK stacks (not yet scaffolded)

### DynamoDB Single-Table Design

All entities share one table with composite keys. Key patterns:

| Entity | PK | SK |
|--------|----|----|
| User | `USER#<id>` | `PROFILE` |
| Poster | `USER#<id>` | `POSTER#<timestamp>` |
| Template | `TEMPLATE` | `<category>#<id>` |

Use `@bjj-poster/db` for all database operations - never access DynamoDB directly.

### Lambda Handler Pattern

Handlers go in `apps/api/src/handlers/{domain}/{action}.ts`. See `.claude/skills/lambda-handler.md` for the full template. Key points:
- Extract userId from `event.requestContext.authorizer?.claims?.sub`
- Use error classes from `@bjj-poster/core` (`ValidationError`, `NotFoundError`, etc.)
- Always log with `requestId` for tracing

## Code Style

- **Files**: kebab-case (`create-poster.ts`)
- **Components**: PascalCase (`PosterBuilder.tsx`)
- **Types/Interfaces**: PascalCase, use `interface` over `type` for objects
- Explicit return types for exported functions
- Use `unknown` over `any`

## Commit Format

```
feat(api): add poster creation endpoint
fix(web): correct image upload validation
test(db): add user repository tests
```

## Local Development URLs

- Web app: http://localhost:3000
- API: http://localhost:3001
- DynamoDB Admin: http://localhost:8001
