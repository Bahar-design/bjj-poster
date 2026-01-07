import { render, screen } from '@testing-library/react';
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
});
