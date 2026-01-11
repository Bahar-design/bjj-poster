import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GuidedTooltips } from '../guided-tooltips';

// Mock react-joyride to avoid actual tour rendering in tests
vi.mock('react-joyride', () => ({
  default: ({
    callback,
    run,
    steps,
  }: {
    callback: (data: { status: string }) => void;
    run: boolean;
    steps: unknown[];
  }) => {
    if (!run) return null;
    return (
      <div data-testid="joyride-mock">
        <span data-testid="step-count">{steps.length}</span>
        <button
          data-testid="skip-button"
          onClick={() => callback({ status: 'skipped' })}
        >
          Skip
        </button>
        <button
          data-testid="finish-button"
          onClick={() => callback({ status: 'finished' })}
        >
          Finish
        </button>
      </div>
    );
  },
  STATUS: {
    FINISHED: 'finished',
    SKIPPED: 'skipped',
  },
}));

describe('GuidedTooltips', () => {
  const mockOnComplete = vi.fn();
  const mockOnSkip = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when run is false', () => {
    render(
      <GuidedTooltips run={false} onComplete={mockOnComplete} onSkip={mockOnSkip} />
    );
    expect(screen.queryByTestId('joyride-mock')).not.toBeInTheDocument();
  });

  it('renders joyride when run is true', () => {
    render(
      <GuidedTooltips run={true} onComplete={mockOnComplete} onSkip={mockOnSkip} />
    );
    expect(screen.getByTestId('joyride-mock')).toBeInTheDocument();
  });

  it('has 3 tooltip steps', () => {
    render(
      <GuidedTooltips run={true} onComplete={mockOnComplete} onSkip={mockOnSkip} />
    );
    expect(screen.getByTestId('step-count')).toHaveTextContent('3');
  });

  it('calls onComplete when tour finishes', async () => {
    const user = userEvent.setup();
    render(
      <GuidedTooltips run={true} onComplete={mockOnComplete} onSkip={mockOnSkip} />
    );

    await user.click(screen.getByTestId('finish-button'));

    expect(mockOnComplete).toHaveBeenCalledTimes(1);
  });

  it('calls onSkip when tour is skipped', async () => {
    const user = userEvent.setup();
    render(
      <GuidedTooltips run={true} onComplete={mockOnComplete} onSkip={mockOnSkip} />
    );

    await user.click(screen.getByTestId('skip-button'));

    expect(mockOnSkip).toHaveBeenCalledTimes(1);
  });
});
