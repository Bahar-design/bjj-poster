import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createWrapper } from './test-utils';

vi.mock('../../api/templates', () => ({
  fetchTemplates: vi.fn(),
}));

describe('useTemplates', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns loading state initially', async () => {
    const { fetchTemplates } = await import('../../api/templates');
    vi.mocked(fetchTemplates).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    const { useTemplates } = await import('../use-templates');

    const { result } = renderHook(() => useTemplates(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it('returns templates data on success', async () => {
    const mockTemplates = [
      { id: '1', name: 'Test', category: 'test', thumbnailUrl: '/test.png' },
    ];
    const { fetchTemplates } = await import('../../api/templates');
    vi.mocked(fetchTemplates).mockResolvedValue(mockTemplates);

    const { useTemplates } = await import('../use-templates');

    const { result } = renderHook(() => useTemplates(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockTemplates);
  });

  it('returns error state on failure', async () => {
    const { fetchTemplates } = await import('../../api/templates');
    vi.mocked(fetchTemplates).mockRejectedValue(new Error('Network error'));

    const { useTemplates } = await import('../use-templates');

    const { result } = renderHook(() => useTemplates(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe('Network error');
  });
});
