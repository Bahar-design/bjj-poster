import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { fetchPosterHistory } from '../api/posters';
import { queryKeys } from '../api/query-keys';
import type { Poster } from '../types/api';

/**
 * Fetches poster history for a specific user
 * Query key: ['posters', userId] when enabled, ['posters', '__DISABLED__'] when disabled
 * Only fetches when userId is provided (enabled guard)
 */
export function usePosterHistory(
  userId: string | undefined
): UseQueryResult<Poster[], Error> {
  return useQuery<Poster[], Error>({
    queryKey: queryKeys.posters.byUser(userId),
    queryFn: () => {
      // Explicit check makes the invariant clear and provides better error messages
      // if TanStack Query's behavior ever changes
      if (!userId) {
        throw new Error('userId is required');
      }
      return fetchPosterHistory(userId);
    },
    enabled: !!userId,
  });
}
