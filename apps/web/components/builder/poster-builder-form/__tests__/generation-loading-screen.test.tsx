import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { GenerationLoadingScreen } from '../generation-loading-screen';

describe('GenerationLoadingScreen', () => {
  it('renders loading screen with progress', () => {
    render(<GenerationLoadingScreen progress={50} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('renders belt animation icon', () => {
    render(<GenerationLoadingScreen progress={0} />);

    expect(screen.getByTestId('belt-animation')).toBeInTheDocument();
  });

  it('renders progress bar with correct width', () => {
    render(<GenerationLoadingScreen progress={75} />);

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '75');

    const progressFill = screen.getByTestId('progress-fill');
    expect(progressFill).toHaveStyle({ width: '75%' });
  });

  it('renders progress bar at 0%', () => {
    render(<GenerationLoadingScreen progress={0} />);

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '0');
  });

  it('renders progress bar at 100%', () => {
    render(<GenerationLoadingScreen progress={100} />);

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '100');
  });
});
