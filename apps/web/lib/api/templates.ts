import type { Template } from '../types/api';

const MOCK_TEMPLATES: Template[] = [
  {
    id: 'tpl-001',
    name: 'Classic Tournament',
    category: 'tournament',
    thumbnailUrl: '/templates/classic.png',
  },
  {
    id: 'tpl-002',
    name: 'Modern Minimal',
    category: 'tournament',
    thumbnailUrl: '/templates/modern.png',
  },
  {
    id: 'tpl-003',
    name: 'Competition Pro',
    category: 'competition',
    thumbnailUrl: '/templates/competition.png',
  },
  {
    id: 'tpl-004',
    name: 'Kids Championship',
    category: 'kids',
    thumbnailUrl: '/templates/kids.png',
  },
];

/**
 * Fetches all available templates
 * TODO: Replace with apiFetch(`${API_BASE_URL}/templates`) when backend is ready
 * @see {@link apiFetch} for error handling
 */
export async function fetchTemplates(): Promise<Template[]> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));
  return MOCK_TEMPLATES;
}
