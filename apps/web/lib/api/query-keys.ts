/**
 * Query key factory for consistent cache key management
 * Prevents typos and ensures type-safe query invalidation
 */
export const queryKeys = {
  templates: {
    all: ['templates'] as const,
  },
  posters: {
    all: ['posters'] as const,
    byUser: (userId: string) => [...queryKeys.posters.all, userId] as const,
  },
} as const;
