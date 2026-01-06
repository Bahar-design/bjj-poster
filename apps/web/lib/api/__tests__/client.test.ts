import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ApiError, apiFetch } from '../client';

describe('ApiError', () => {
  it('creates error with status and message', () => {
    const error = new ApiError(404, 'Not found');

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('ApiError');
    expect(error.status).toBe(404);
    expect(error.message).toBe('Not found');
  });

  it('creates error with cause for debugging', () => {
    const cause = new TypeError('Network failed');
    const error = new ApiError(0, 'Network error', { cause });

    expect(error.cause).toBe(cause);
  });

  it('works without cause option', () => {
    const error = new ApiError(500, 'Server error');

    expect(error.cause).toBeUndefined();
  });
});

describe('apiFetch', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns parsed JSON on successful response', async () => {
    const mockData = { id: 1, name: 'Test' };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    const result = await apiFetch<typeof mockData>('/api/test');

    expect(result).toEqual(mockData);
    expect(fetch).toHaveBeenCalledWith('/api/test');
  });

  it('throws ApiError with status on HTTP error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    await expect(apiFetch('/api/test')).rejects.toThrow(ApiError);
    await expect(apiFetch('/api/test')).rejects.toMatchObject({
      status: 404,
      message: 'API error: Not Found',
    });
  });

  it('throws ApiError with status 0 on network error', async () => {
    const networkError = new TypeError('Failed to fetch');
    global.fetch = vi.fn().mockRejectedValue(networkError);

    await expect(apiFetch('/api/test')).rejects.toThrow(ApiError);
    await expect(apiFetch('/api/test')).rejects.toMatchObject({
      status: 0,
      message: 'Network error: Failed to fetch',
    });
  });

  it('preserves original error as cause on network error', async () => {
    const networkError = new TypeError('Failed to fetch');
    global.fetch = vi.fn().mockRejectedValue(networkError);

    try {
      await apiFetch('/api/test');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).cause).toBe(networkError);
    }
  });
});
