import { useQuery } from '@tanstack/react-query';
import { fetchPosterHistory } from '../api/posters';
import type { Poster } from '../types/api';

/**
 * Fetches poster history for a specific user
 * Query key: ['posters', userId]
 * Only fetches when userId is provided
 */
export function usePosterHistory(userId: string | undefined) {
  return useQuery<Poster[], Error>({
    queryKey: ['posters', userId],
    queryFn: () => fetchPosterHistory(userId!),
    enabled: !!userId,
  });
}
