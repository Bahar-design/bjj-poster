import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PosterGridEmpty } from '../poster-grid/poster-grid-empty';

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('PosterGridEmpty', () => {
  it('renders empty state message', () => {
    render(<PosterGridEmpty />);

    expect(screen.getByText(/no posters yet/i)).toBeInTheDocument();
  });

  it('renders create poster button linking to builder', () => {
    render(<PosterGridEmpty />);

    const link = screen.getByRole('link', { name: /create poster/i });
    expect(link).toHaveAttribute('href', '/builder');
  });

  it('renders decorative icon', () => {
    render(<PosterGridEmpty />);

    expect(screen.getByTestId('empty-icon')).toBeInTheDocument();
  });
});
