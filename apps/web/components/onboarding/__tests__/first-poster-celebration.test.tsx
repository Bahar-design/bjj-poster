import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FirstPosterCelebration } from '../first-poster-celebration';

// Mock the hook
const mockTriggerCelebration = vi.fn();
const mockMarkDownloaded = vi.fn();
const mockDismiss = vi.fn();

vi.mock('../use-first-poster-celebration', () => ({
  useFirstPosterCelebration: vi.fn(() => ({
    showCelebration: true,
    posterData: { imageUrl: '/test-poster.png', posterId: '123' },
    hasDownloaded: false,
    triggerCelebration: mockTriggerCelebration,
    markDownloaded: mockMarkDownloaded,
    dismiss: mockDismiss,
  })),
}));

// Mock user store
vi.mock('@/lib/stores/user-store', () => ({
  useUserStore: vi.fn((selector) =>
    selector({
      subscriptionTier: 'free',
      postersThisMonth: 1,
      postersLimit: 3,
    })
  ),
}));

// Mock analytics
vi.mock('@/lib/analytics', () => ({
  track: vi.fn(),
}));

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...props} />
  ),
}));

// Get reference to mocks
import { useFirstPosterCelebration } from '../use-first-poster-celebration';
import { useUserStore } from '@/lib/stores/user-store';
const mockUseFirstPosterCelebration = vi.mocked(useFirstPosterCelebration);
const mockUseUserStore = vi.mocked(useUserStore);

describe('FirstPosterCelebration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseFirstPosterCelebration.mockReturnValue({
      showCelebration: true,
      posterData: { imageUrl: '/test-poster.png', posterId: '123' },
      hasDownloaded: false,
      triggerCelebration: mockTriggerCelebration,
      markDownloaded: mockMarkDownloaded,
      dismiss: mockDismiss,
    });
    mockUseUserStore.mockImplementation((selector) =>
      selector({
        subscriptionTier: 'free',
        postersThisMonth: 1,
        postersLimit: 3,
        user: null,
        setUser: vi.fn(),
        resetUser: vi.fn(),
        canCreatePoster: vi.fn(),
        incrementUsage: vi.fn(),
      })
    );
  });

  it('renders celebration modal when showCelebration is true', () => {
    render(<FirstPosterCelebration />);

    expect(screen.getByText('Congratulations!')).toBeInTheDocument();
    expect(screen.getByText('You created your first tournament poster!')).toBeInTheDocument();
  });

  it('does not render when showCelebration is false', () => {
    mockUseFirstPosterCelebration.mockReturnValue({
      showCelebration: false,
      posterData: null,
      hasDownloaded: false,
      triggerCelebration: mockTriggerCelebration,
      markDownloaded: mockMarkDownloaded,
      dismiss: mockDismiss,
    });

    render(<FirstPosterCelebration />);

    expect(screen.queryByText('Congratulations!')).not.toBeInTheDocument();
  });

  it('displays poster image', () => {
    render(<FirstPosterCelebration />);

    const img = screen.getByRole('img', { name: /generated poster/i });
    expect(img).toHaveAttribute('src', '/test-poster.png');
  });

  it('shows download button', () => {
    render(<FirstPosterCelebration />);

    expect(screen.getByRole('button', { name: /download poster/i })).toBeInTheDocument();
  });

  it('hides Go to Dashboard button when not downloaded', () => {
    render(<FirstPosterCelebration />);

    expect(screen.queryByRole('button', { name: /go to dashboard/i })).not.toBeInTheDocument();
  });

  it('shows Go to Dashboard button after download', () => {
    mockUseFirstPosterCelebration.mockReturnValue({
      showCelebration: true,
      posterData: { imageUrl: '/test-poster.png', posterId: '123' },
      hasDownloaded: true,
      triggerCelebration: mockTriggerCelebration,
      markDownloaded: mockMarkDownloaded,
      dismiss: mockDismiss,
    });

    render(<FirstPosterCelebration />);

    expect(screen.getByRole('button', { name: /go to dashboard/i })).toBeInTheDocument();
  });

  it('calls dismiss when Go to Dashboard is clicked', () => {
    mockUseFirstPosterCelebration.mockReturnValue({
      showCelebration: true,
      posterData: { imageUrl: '/test-poster.png', posterId: '123' },
      hasDownloaded: true,
      triggerCelebration: mockTriggerCelebration,
      markDownloaded: mockMarkDownloaded,
      dismiss: mockDismiss,
    });

    render(<FirstPosterCelebration />);

    fireEvent.click(screen.getByRole('button', { name: /go to dashboard/i }));

    expect(mockDismiss).toHaveBeenCalled();
  });

  it('shows quota reminder for free users', () => {
    render(<FirstPosterCelebration />);

    expect(screen.getByText(/you have 2 posters? left this month/i)).toBeInTheDocument();
    expect(screen.getByText(/free plan/i)).toBeInTheDocument();
  });

  it('shows upsell link for free users', () => {
    render(<FirstPosterCelebration />);

    expect(screen.getByText(/want unlimited posters/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /see pro plans/i })).toHaveAttribute('href', '/pricing');
  });

  it('hides upsell for pro users', () => {
    mockUseUserStore.mockImplementation((selector) =>
      selector({
        subscriptionTier: 'pro',
        postersThisMonth: 1,
        postersLimit: 20,
        user: null,
        setUser: vi.fn(),
        resetUser: vi.fn(),
        canCreatePoster: vi.fn(),
        incrementUsage: vi.fn(),
      })
    );

    render(<FirstPosterCelebration />);

    expect(screen.queryByText(/want unlimited posters/i)).not.toBeInTheDocument();
  });

  it('shows social share buttons after download', () => {
    mockUseFirstPosterCelebration.mockReturnValue({
      showCelebration: true,
      posterData: { imageUrl: '/test-poster.png', posterId: '123' },
      hasDownloaded: true,
      triggerCelebration: mockTriggerCelebration,
      markDownloaded: mockMarkDownloaded,
      dismiss: mockDismiss,
    });

    render(<FirstPosterCelebration />);

    expect(screen.getByLabelText(/share on facebook/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Share')).toBeInTheDocument();
  });

  it('shows skip button before download', () => {
    render(<FirstPosterCelebration />);

    expect(screen.getByRole('button', { name: /skip for now/i })).toBeInTheDocument();
  });

  it('hides skip button after download', () => {
    mockUseFirstPosterCelebration.mockReturnValue({
      showCelebration: true,
      posterData: { imageUrl: '/test-poster.png', posterId: '123' },
      hasDownloaded: true,
      triggerCelebration: mockTriggerCelebration,
      markDownloaded: mockMarkDownloaded,
      dismiss: mockDismiss,
    });

    render(<FirstPosterCelebration />);

    expect(screen.queryByRole('button', { name: /skip for now/i })).not.toBeInTheDocument();
  });

  it('calls dismiss when skip is clicked', () => {
    render(<FirstPosterCelebration />);

    fireEvent.click(screen.getByRole('button', { name: /skip for now/i }));

    expect(mockDismiss).toHaveBeenCalled();
  });
});
