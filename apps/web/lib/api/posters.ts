import type { Poster } from '../types/api';

const MOCK_POSTERS: Record<string, Poster[]> = {
  'user-001': [
    {
      id: 'poster-001',
      templateId: 'tpl-001',
      createdAt: '2026-01-01T10:00:00Z',
      thumbnailUrl: '/posters/poster-001.png',
      title: 'Spring Championship 2026',
    },
    {
      id: 'poster-002',
      templateId: 'tpl-002',
      createdAt: '2026-01-03T14:30:00Z',
      thumbnailUrl: '/posters/poster-002.png',
      title: 'Kids Open Mat',
    },
  ],
};

/**
 * Fetches poster history for a specific user
 * TODO: Replace with real API call when backend is ready
 */
export async function fetchPosterHistory(userId: string): Promise<Poster[]> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));
  return MOCK_POSTERS[userId] ?? [];
}
