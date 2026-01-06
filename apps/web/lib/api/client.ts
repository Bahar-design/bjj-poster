/**
 * Custom error class for API errors with status code
 * Includes optional cause for error chaining and debugging
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    options?: { cause?: unknown }
  ) {
    super(message, options);
    this.name = 'ApiError';
  }
}

/**
 * Type-safe fetch wrapper with error handling
 * Wraps both HTTP errors and network failures in ApiError for consistent error handling
 */
export async function apiFetch<T>(url: string): Promise<T> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new ApiError(response.status, `API error: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    // Re-throw if already an ApiError
    if (error instanceof ApiError) {
      throw error;
    }
    // Wrap network errors (CORS, timeout, no internet) in ApiError with cause for debugging
    throw new ApiError(
      0,
      `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      { cause: error }
    );
  }
}
