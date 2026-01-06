/**
 * Sentinel symbol for disabled queries - cannot collide with real user IDs
 */
const DISABLED_USER = Symbol('disabled-user');

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
     * Uses Symbol sentinel when userId is undefined to prevent any possible collision
     */
    byUser: (userId: string | undefined) =>
      userId
        ? ([...queryKeys.posters.all, userId] as const)
        : ([...queryKeys.posters.all, DISABLED_USER] as const),
  },
} as const;
