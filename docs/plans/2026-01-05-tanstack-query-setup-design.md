# TanStack Query Setup Design

**Issue:** ODE-61 - UI-FND-004: TanStack Query Setup
**Date:** 2026-01-05
**Status:** Approved

## Overview

Configure TanStack Query for server state management with caching for templates, user data, and poster history.

## File Structure

```
apps/web/
├── app/
│   ├── providers.tsx          # QueryClientProvider + DevTools wrapper
│   └── layout.tsx             # Updated to wrap with Providers
├── lib/
│   ├── api/
│   │   ├── client.ts          # Base fetch wrapper with error handling
│   │   ├── templates.ts       # fetchTemplates() mock
│   │   └── posters.ts         # fetchPosterHistory() mock
│   ├── hooks/
│   │   ├── use-templates.ts   # useTemplates() query hook
│   │   ├── use-poster-history.ts  # usePosterHistory() query hook
│   │   └── __tests__/
│   │       ├── test-utils.tsx
│   │       ├── use-templates.test.ts
│   │       └── use-poster-history.test.ts
│   └── types/
│       └── api.ts             # Template, Poster interfaces
```

## Dependencies

- `@tanstack/react-query` - Core library
- `@tanstack/react-query-devtools` - DevTools for debugging

## QueryClient Configuration

```tsx
new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // 5 minutes
      gcTime: 30 * 60 * 1000,        // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

- SSR-safe pattern: `useState(makeQueryClient)` ensures one QueryClient per app instance
- DevTools render only in development automatically

## TypeScript Interfaces

```tsx
interface Template {
  id: string;
  name: string;
  category: string;
  thumbnailUrl: string;
}

interface Poster {
  id: string;
  templateId: string;
  createdAt: string;
  thumbnailUrl: string;
  title: string;
}
```

## API Layer

Base fetch client with typed error handling:

```tsx
class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiFetch<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new ApiError(response.status, `API error: ${response.statusText}`);
  }
  return response.json();
}
```

Mock implementations simulate network delay and return hardcoded data.

## Custom Hooks

**useTemplates:**
- Query key: `['templates']`
- Fetches all available templates

**usePosterHistory:**
- Query key: `['posters', userId]`
- `enabled: !!userId` - only fetches when user is authenticated

## Testing Strategy

- Isolated QueryClient per test with `retry: false`, `gcTime: 0`
- Mock API functions via `vi.mock()`
- Test cases cover: loading state, success state, error state
- `usePosterHistory` additionally tests disabled state when no userId

## Decisions

1. **Mock fetch functions over static data** - Mirrors real API contract for seamless transition
2. **Separate api/ from hooks/** - API layer testable independently, easy to swap for real endpoints
3. **vi.mock over MSW** - Simpler for unit tests, no extra dependencies
