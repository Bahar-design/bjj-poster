/**
 * API configuration with environment-based URL
 *
 * Currently exported for future use when mock API functions are replaced with real API calls.
 * Mock functions in templates.ts and posters.ts have TODO comments indicating they should use
 * apiFetch with this base URL when backend is ready.
 *
 * @example
 * // Future usage in real API calls:
 * apiFetch(`${API_BASE_URL}/templates`)
 * apiFetch(`${API_BASE_URL}/users/${userId}/posters`)
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
