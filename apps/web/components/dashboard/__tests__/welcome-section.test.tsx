import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WelcomeSection } from '../welcome-section';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock the user store
const mockUseUserStore = vi.fn();
vi.mock('@/lib/stores', () => ({
  useUserStore: (selector: (state: unknown) => unknown) => mockUseUserStore(selector),
  UNLIMITED: -1,
}));

// Mock UsageCard since it has its own tests
vi.mock('../usage-card', () => ({
  UsageCard: () => <div data-testid="usage-card-mock">UsageCard</div>,
}));

describe('WelcomeSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays welcome message with user name', () => {
    mockUseUserStore.mockImplementation((selector) =>
      selector({
        user: { name: 'John Doe', email: 'john@example.com' },
        postersThisMonth: 2,
        postersLimit: 5,
      })
    );

    render(<WelcomeSection />);

    expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
    expect(screen.getByText(/john/i)).toBeInTheDocument();
  });

  it('displays generic welcome when no user name', () => {
    mockUseUserStore.mockImplementation((selector) =>
      selector({
        user: null,
        postersThisMonth: 0,
        postersLimit: 3,
      })
    );

    render(<WelcomeSection />);

    expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
  });

  it('shows at-limit message when user has reached quota', () => {
    mockUseUserStore.mockImplementation((selector) =>
      selector({
        user: { name: 'John', email: 'john@example.com' },
        postersThisMonth: 3,
        postersLimit: 3,
      })
    );

    render(<WelcomeSection />);

    expect(screen.getByText(/reached your monthly limit/i)).toBeInTheDocument();
  });

  it('shows ready message when user has quota remaining', () => {
    mockUseUserStore.mockImplementation((selector) =>
      selector({
        user: { name: 'John', email: 'john@example.com' },
        postersThisMonth: 1,
        postersLimit: 3,
      })
    );

    render(<WelcomeSection />);

    expect(screen.getByText(/ready to create/i)).toBeInTheDocument();
  });

  it('renders UsageCard component', () => {
    mockUseUserStore.mockImplementation((selector) =>
      selector({
        user: null,
        postersThisMonth: 0,
        postersLimit: 3,
      })
    );

    render(<WelcomeSection />);

    expect(screen.getByTestId('usage-card-mock')).toBeInTheDocument();
  });
});
