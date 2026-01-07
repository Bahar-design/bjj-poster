import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TemplateSelector } from '../template-selector';

// Mock the hooks
vi.mock('@/lib/hooks', () => ({
  useTemplates: vi.fn(),
}));

vi.mock('@/lib/stores/poster-builder-store', () => ({
  usePosterBuilderStore: vi.fn(() => ({
    selectedTemplateId: null,
    setTemplate: vi.fn(),
  })),
}));

import { useTemplates } from '@/lib/hooks';

const mockTemplates = [
  { id: 'tpl-001', name: 'Classic', category: 'tournament', thumbnailUrl: '/1.png' },
  { id: 'tpl-002', name: 'Modern', category: 'tournament', thumbnailUrl: '/2.png' },
  { id: 'tpl-003', name: 'Bold', category: 'competition', thumbnailUrl: '/3.png' },
  { id: 'tpl-004', name: 'Kids', category: 'kids', thumbnailUrl: '/4.png' },
];

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('TemplateSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading skeletons when loading', () => {
    vi.mocked(useTemplates).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as ReturnType<typeof useTemplates>);

    render(<TemplateSelector />, { wrapper: createWrapper() });

    const skeletons = screen.getAllByTestId('template-skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows error message and retry button when error', () => {
    vi.mocked(useTemplates).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Network error'),
      refetch: vi.fn(),
    } as ReturnType<typeof useTemplates>);

    render(<TemplateSelector />, { wrapper: createWrapper() });

    expect(screen.getByText('Failed to load templates')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('calls refetch when retry button clicked', async () => {
    const refetch = vi.fn();
    vi.mocked(useTemplates).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Network error'),
      refetch,
    } as ReturnType<typeof useTemplates>);

    render(<TemplateSelector />, { wrapper: createWrapper() });

    await userEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(refetch).toHaveBeenCalled();
  });

  it('displays recommended section with first 3 templates', () => {
    vi.mocked(useTemplates).mockReturnValue({
      data: mockTemplates,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as ReturnType<typeof useTemplates>);

    render(<TemplateSelector />, { wrapper: createWrapper() });

    expect(screen.getByText('Recommended for you')).toBeInTheDocument();
    expect(screen.getByText('Classic')).toBeInTheDocument();
    expect(screen.getByText('Modern')).toBeInTheDocument();
    expect(screen.getByText('Bold')).toBeInTheDocument();
  });
});
