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
    /**
     * Query key for user-specific poster history
     * Uses 'no-user' sentinel value when userId is undefined to prevent cache collisions
     */
    byUser: (userId: string | undefined) =>
      [...queryKeys.posters.all, userId ?? 'no-user'] as const,
  },
} as const;
