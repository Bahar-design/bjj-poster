import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createWrapper } from './test-utils';
import { fetchTemplates } from '../../api/templates';
import { useTemplates } from '../use-templates';

vi.mock('../../api/templates', () => ({
  fetchTemplates: vi.fn(),
}));

describe('useTemplates', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns loading state initially', () => {
    vi.mocked(fetchTemplates).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    const { result } = renderHook(() => useTemplates(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isFetching).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it('returns templates data on success', async () => {
    const mockTemplates = [
      { id: '1', name: 'Test', category: 'test', thumbnailUrl: '/test.png' },
    ];
    vi.mocked(fetchTemplates).mockResolvedValue(mockTemplates);

    const { result } = renderHook(() => useTemplates(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockTemplates);
    expect(result.current.isFetching).toBe(false);
  });

  it('returns error state on failure', async () => {
    vi.mocked(fetchTemplates).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useTemplates(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe('Network error');
    expect(result.current.isFetching).toBe(false);
  });
});
