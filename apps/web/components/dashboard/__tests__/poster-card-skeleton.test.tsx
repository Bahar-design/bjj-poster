import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PosterCardSkeleton } from '../poster-grid/poster-card-skeleton';

describe('PosterCardSkeleton', () => {
  it('renders skeleton with pulse animation', () => {
    render(<PosterCardSkeleton />);

    const skeleton = screen.getByTestId('poster-card-skeleton');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveClass('animate-pulse');
  });

  it('has 3:4 aspect ratio thumbnail placeholder', () => {
    render(<PosterCardSkeleton />);

    const thumbnail = screen.getByTestId('skeleton-thumbnail');
    expect(thumbnail).toHaveClass('aspect-[3/4]');
  });

  it('has title and subtitle placeholders', () => {
    render(<PosterCardSkeleton />);

    expect(screen.getByTestId('skeleton-title')).toBeInTheDocument();
    expect(screen.getByTestId('skeleton-subtitle')).toBeInTheDocument();
  });

  it('has action button placeholders', () => {
    render(<PosterCardSkeleton />);

    const actions = screen.getByTestId('skeleton-actions');
    expect(actions.children).toHaveLength(3);
  });
});
