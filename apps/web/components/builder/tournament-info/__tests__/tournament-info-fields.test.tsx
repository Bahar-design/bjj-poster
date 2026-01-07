import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TournamentInfoFields } from '../tournament-info-fields';

// Mock the store
const createMockState = (overrides = {}) => ({
  athletePhoto: null,
  athleteName: '',
  beltRank: 'white' as const,
  team: '',
  tournament: '',
  date: '',
  location: '',
  selectedTemplateId: null,
  isGenerating: false,
  generationProgress: 0,
  showAdvancedOptions: false,
  showPreview: false,
  setPhoto: vi.fn(),
  setField: vi.fn(),
  setTemplate: vi.fn(),
  setGenerating: vi.fn(),
  toggleAdvancedOptions: vi.fn(),
  togglePreview: vi.fn(),
  reset: vi.fn(),
  ...overrides,
});

vi.mock('@/lib/stores', () => ({
  usePosterBuilderStore: vi.fn((selector) => {
    const state = createMockState();
    return selector ? selector(state) : state;
  }),
}));

describe('TournamentInfoFields', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders tournament name input with label', () => {
      render(<TournamentInfoFields />);
      expect(screen.getByLabelText(/tournament name/i)).toBeInTheDocument();
    });

    it('marks tournament name as required with asterisk', () => {
      render(<TournamentInfoFields />);
      const label = screen.getByText(/tournament name/i).closest('label');
      expect(label).toHaveTextContent('*');
    });
  });

  describe('validation', () => {
    it('shows error when tournament name is empty on blur', async () => {
      const user = userEvent.setup();
      render(<TournamentInfoFields />);

      const input = screen.getByLabelText(/tournament name/i);
      await user.click(input);
      await user.tab();

      expect(screen.getByText('Tournament name is required')).toBeInTheDocument();
    });

    it('shows error when tournament name exceeds 100 characters', async () => {
      const user = userEvent.setup();
      render(<TournamentInfoFields />);

      const input = screen.getByLabelText(/tournament name/i);
      await user.type(input, 'A'.repeat(101));
      await user.tab();

      expect(screen.getByText('Tournament name must be 100 characters or less')).toBeInTheDocument();
    });

    it('clears error when user types valid input', async () => {
      const user = userEvent.setup();
      render(<TournamentInfoFields />);

      const input = screen.getByLabelText(/tournament name/i);
      await user.click(input);
      await user.tab();

      expect(screen.getByText('Tournament name is required')).toBeInTheDocument();

      await user.type(input, 'IBJJF Worlds');

      expect(screen.queryByText('Tournament name is required')).not.toBeInTheDocument();
    });

    it('sets aria-invalid on input with error', async () => {
      const user = userEvent.setup();
      render(<TournamentInfoFields />);

      const input = screen.getByLabelText(/tournament name/i);
      await user.click(input);
      await user.tab();

      expect(input).toHaveAttribute('aria-invalid', 'true');
    });
  });
});
