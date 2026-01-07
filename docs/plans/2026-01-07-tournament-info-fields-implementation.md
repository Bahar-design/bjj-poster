# Tournament Info Fields Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create TournamentInfoFields component with tournament name, date, location fields and collapsible advanced section.

**Architecture:** Follow AthleteInfoFields patterns - local state with debounced store sync for text fields, immediate sync for date. CSS-only grid animation for collapsible section. Zod validation schema.

**Tech Stack:** React, Zustand, Zod, Tailwind CSS, Vitest, React Testing Library

---

## Task 1: Create Validation Schema

**Files:**
- Create: `apps/web/lib/validations/tournament-info.ts`
- Modify: `apps/web/lib/validations/index.ts`
- Test: `apps/web/lib/validations/__tests__/tournament-info.test.ts`

**Step 1: Write the failing test**

Create `apps/web/lib/validations/__tests__/tournament-info.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  tournamentInfoSchema,
  MAX_TOURNAMENT_LENGTH,
  MAX_LOCATION_LENGTH,
} from '../tournament-info';

describe('tournamentInfoSchema', () => {
  describe('tournament field', () => {
    it('validates required tournament name', () => {
      const result = tournamentInfoSchema.shape.tournament.safeParse('');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toBe('Tournament name is required');
      }
    });

    it('trims whitespace and validates', () => {
      const result = tournamentInfoSchema.shape.tournament.safeParse('   ');
      expect(result.success).toBe(false);
    });

    it('accepts valid tournament name', () => {
      const result = tournamentInfoSchema.shape.tournament.safeParse('IBJJF Worlds 2026');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('IBJJF Worlds 2026');
      }
    });

    it('rejects tournament name exceeding max length', () => {
      const result = tournamentInfoSchema.shape.tournament.safeParse('A'.repeat(101));
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toBe(
          'Tournament name must be 100 characters or less'
        );
      }
    });

    it('exports MAX_TOURNAMENT_LENGTH as 100', () => {
      expect(MAX_TOURNAMENT_LENGTH).toBe(100);
    });
  });

  describe('date field', () => {
    it('accepts empty date (optional)', () => {
      const result = tournamentInfoSchema.shape.date.safeParse('');
      expect(result.success).toBe(true);
    });

    it('accepts valid ISO date format', () => {
      const result = tournamentInfoSchema.shape.date.safeParse('2026-03-15');
      expect(result.success).toBe(true);
    });

    it('rejects invalid date format', () => {
      const result = tournamentInfoSchema.shape.date.safeParse('March 15, 2026');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toBe('Invalid date format');
      }
    });
  });

  describe('location field', () => {
    it('accepts empty location (optional)', () => {
      const result = tournamentInfoSchema.shape.location.safeParse('');
      expect(result.success).toBe(true);
    });

    it('trims whitespace', () => {
      const result = tournamentInfoSchema.shape.location.safeParse('  Las Vegas, NV  ');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('Las Vegas, NV');
      }
    });

    it('rejects location exceeding max length', () => {
      const result = tournamentInfoSchema.shape.location.safeParse('A'.repeat(101));
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toBe(
          'Location must be 100 characters or less'
        );
      }
    });

    it('exports MAX_LOCATION_LENGTH as 100', () => {
      expect(MAX_LOCATION_LENGTH).toBe(100);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @bjj-poster/web test -- lib/validations/__tests__/tournament-info.test.ts`

Expected: FAIL - Cannot find module '../tournament-info'

**Step 3: Write minimal implementation**

Create `apps/web/lib/validations/tournament-info.ts`:

```typescript
import { z } from 'zod';

/** Maximum length for tournament name field */
export const MAX_TOURNAMENT_LENGTH = 100;

/** Maximum length for location field */
export const MAX_LOCATION_LENGTH = 100;

/**
 * Tournament info validation schema.
 * Uses .trim() which both validates against trimmed values AND returns trimmed output.
 */
export const tournamentInfoSchema = z.object({
  tournament: z
    .string()
    .trim()
    .min(1, 'Tournament name is required')
    .max(MAX_TOURNAMENT_LENGTH, 'Tournament name must be 100 characters or less'),
  date: z
    .string()
    .refine(
      (val) => val === '' || /^\d{4}-\d{2}-\d{2}$/.test(val),
      'Invalid date format'
    ),
  location: z
    .string()
    .trim()
    .max(MAX_LOCATION_LENGTH, 'Location must be 100 characters or less'),
});

export type TournamentInfoFormData = z.infer<typeof tournamentInfoSchema>;
```

**Step 4: Update index.ts exports**

Modify `apps/web/lib/validations/index.ts` - add at end:

```typescript
export {
  tournamentInfoSchema,
  MAX_TOURNAMENT_LENGTH,
  MAX_LOCATION_LENGTH,
  type TournamentInfoFormData,
} from './tournament-info';
```

**Step 5: Run test to verify it passes**

Run: `pnpm --filter @bjj-poster/web test -- lib/validations/__tests__/tournament-info.test.ts`

Expected: PASS (all 10 tests)

**Step 6: Commit**

```bash
git add apps/web/lib/validations/tournament-info.ts apps/web/lib/validations/__tests__/tournament-info.test.ts apps/web/lib/validations/index.ts
git commit -m "feat(validations): add tournament info validation schema"
```

---

## Task 2: Create Component File Structure

**Files:**
- Create: `apps/web/components/builder/tournament-info/index.ts`
- Create: `apps/web/components/builder/tournament-info/tournament-info-fields.tsx` (skeleton)
- Modify: `apps/web/components/builder/index.ts`

**Step 1: Create directory and index.ts**

Create `apps/web/components/builder/tournament-info/index.ts`:

```typescript
export { TournamentInfoFields } from './tournament-info-fields';
```

**Step 2: Create component skeleton**

Create `apps/web/components/builder/tournament-info/tournament-info-fields.tsx`:

```typescript
'use client';

import React from 'react';

/**
 * Form fields for tournament information (name, date, location).
 * Features collapsible advanced section, debounced auto-save, and validation.
 */
export function TournamentInfoFields(): React.ReactElement {
  return (
    <div className="space-y-4">
      <p>TournamentInfoFields placeholder</p>
    </div>
  );
}
```

**Step 3: Update builder index.ts**

Modify `apps/web/components/builder/index.ts` - add export:

```typescript
export { TournamentInfoFields } from './tournament-info';
```

**Step 4: Verify no type errors**

Run: `pnpm --filter @bjj-poster/web type-check`

Expected: No errors

**Step 5: Commit**

```bash
git add apps/web/components/builder/tournament-info/ apps/web/components/builder/index.ts
git commit -m "feat(builder): scaffold TournamentInfoFields component"
```

---

## Task 3: Test and Implement Tournament Name Field

**Files:**
- Create: `apps/web/components/builder/tournament-info/__tests__/tournament-info-fields.test.tsx`
- Modify: `apps/web/components/builder/tournament-info/tournament-info-fields.tsx`

**Step 1: Write the failing test for rendering**

Create `apps/web/components/builder/tournament-info/__tests__/tournament-info-fields.test.tsx`:

```typescript
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TournamentInfoFields } from '../tournament-info-fields';
import { usePosterBuilderStore } from '@/lib/stores';

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
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @bjj-poster/web test -- components/builder/tournament-info/__tests__/tournament-info-fields.test.tsx`

Expected: FAIL - Unable to find label with text: /tournament name/i

**Step 3: Implement tournament name field**

Update `apps/web/components/builder/tournament-info/tournament-info-fields.tsx`:

```typescript
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePosterBuilderStore } from '@/lib/stores';
import { useDebouncedStoreSync } from '@/lib/hooks/use-debounced-store-sync';
import {
  tournamentInfoSchema,
  MAX_TOURNAMENT_LENGTH,
} from '@/lib/validations';

/** Type for field-specific errors */
interface FieldErrors {
  tournament?: string;
  location?: string;
}

/** Debounce delay in milliseconds for text field updates */
export const DEBOUNCE_MS = 300;

/**
 * Form fields for tournament information (name, date, location).
 * Features collapsible advanced section, debounced auto-save, and validation.
 */
export function TournamentInfoFields(): React.ReactElement {
  // Get state and actions from store with shallow comparison
  const { storeTournament, setField } = usePosterBuilderStore(
    useShallow((state) => ({
      storeTournament: state.tournament,
      setField: state.setField,
    }))
  );

  // Local state for immediate UI updates
  const [tournament, setTournament] = useState(storeTournament);

  // Validation state
  const [errors, setErrors] = useState<FieldErrors>({});

  // Validate a single field using Zod schema
  const validateField = useCallback(
    (fieldName: 'tournament' | 'location', value: string): string | undefined => {
      const fieldSchema = tournamentInfoSchema.shape[fieldName];
      const result = fieldSchema.safeParse(value);
      if (!result.success) {
        return result.error.errors[0]?.message;
      }
      return undefined;
    },
    []
  );

  // Sync local state when store changes
  useEffect(() => {
    setTournament(storeTournament);
  }, [storeTournament]);

  // Debounced sync to store for tournament name
  useDebouncedStoreSync(
    tournament,
    storeTournament,
    useCallback((value: string) => setField('tournament', value.trim()), [setField]),
    {
      delayMs: DEBOUNCE_MS,
      validate: useCallback(
        (value: string) => validateField('tournament', value),
        [validateField]
      ),
    }
  );

  // Optimistically clear error for valid input
  const handleTournamentChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setTournament(value);
      if (errors.tournament && value.trim().length > 0 && value.length <= MAX_TOURNAMENT_LENGTH) {
        setErrors((prev) => ({ ...prev, tournament: undefined }));
      }
    },
    [errors.tournament]
  );

  // Validate on blur
  const handleTournamentBlur = useCallback(() => {
    const error = validateField('tournament', tournament);
    setErrors((prev) => ({ ...prev, tournament: error }));
  }, [tournament, validateField]);

  return (
    <div className="space-y-4">
      {/* Tournament Name */}
      <div className="space-y-2">
        <Label htmlFor="tournament-name">
          Tournament Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="tournament-name"
          type="text"
          placeholder="Enter tournament name"
          value={tournament}
          onChange={handleTournamentChange}
          onBlur={handleTournamentBlur}
          aria-required="true"
          aria-invalid={!!errors.tournament}
          aria-describedby={errors.tournament ? 'tournament-name-error' : undefined}
        />
        {errors.tournament && (
          <p id="tournament-name-error" className="text-sm text-destructive">
            {errors.tournament}
          </p>
        )}
      </div>
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @bjj-poster/web test -- components/builder/tournament-info/__tests__/tournament-info-fields.test.tsx`

Expected: PASS (2 tests)

**Step 5: Commit**

```bash
git add apps/web/components/builder/tournament-info/
git commit -m "feat(builder): add tournament name field with validation"
```

---

## Task 4: Test and Implement Tournament Name Validation

**Files:**
- Modify: `apps/web/components/builder/tournament-info/__tests__/tournament-info-fields.test.tsx`

**Step 1: Write failing tests for validation**

Add to the test file after the `rendering` describe block:

```typescript
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
```

**Step 2: Run tests to verify they pass (already implemented)**

Run: `pnpm --filter @bjj-poster/web test -- components/builder/tournament-info/__tests__/tournament-info-fields.test.tsx`

Expected: PASS (6 tests)

**Step 3: Commit**

```bash
git add apps/web/components/builder/tournament-info/__tests__/
git commit -m "test(builder): add tournament name validation tests"
```

---

## Task 5: Test and Implement Collapsible Toggle Button

**Files:**
- Modify: `apps/web/components/builder/tournament-info/__tests__/tournament-info-fields.test.tsx`
- Modify: `apps/web/components/builder/tournament-info/tournament-info-fields.tsx`

**Step 1: Write failing tests for toggle button**

Add to the test file:

```typescript
  describe('collapsible section', () => {
    it('renders "Add more details" button when collapsed', () => {
      render(<TournamentInfoFields />);
      expect(screen.getByRole('button', { name: /add more details/i })).toBeInTheDocument();
    });

    it('hides date and location fields by default', () => {
      render(<TournamentInfoFields />);
      expect(screen.queryByLabelText(/date/i)).not.toBeVisible();
      expect(screen.queryByLabelText(/location/i)).not.toBeVisible();
    });

    it('calls toggleAdvancedOptions when button clicked', async () => {
      const mockToggle = vi.fn();
      vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
        const state = createMockState({ toggleAdvancedOptions: mockToggle });
        return selector ? selector(state) : state;
      });

      const user = userEvent.setup();
      render(<TournamentInfoFields />);

      await user.click(screen.getByRole('button', { name: /add more details/i }));

      expect(mockToggle).toHaveBeenCalledTimes(1);
    });

    it('shows "Hide details" button when expanded', () => {
      vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
        const state = createMockState({ showAdvancedOptions: true });
        return selector ? selector(state) : state;
      });

      render(<TournamentInfoFields />);

      expect(screen.getByRole('button', { name: /hide details/i })).toBeInTheDocument();
    });

    it('shows date and location fields when expanded', () => {
      vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
        const state = createMockState({ showAdvancedOptions: true });
        return selector ? selector(state) : state;
      });

      render(<TournamentInfoFields />);

      expect(screen.getByLabelText(/date/i)).toBeVisible();
      expect(screen.getByLabelText(/location/i)).toBeVisible();
    });

    it('sets aria-expanded on toggle button', () => {
      render(<TournamentInfoFields />);

      const button = screen.getByRole('button', { name: /add more details/i });
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });

    it('sets aria-expanded true when expanded', () => {
      vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
        const state = createMockState({ showAdvancedOptions: true });
        return selector ? selector(state) : state;
      });

      render(<TournamentInfoFields />);

      const button = screen.getByRole('button', { name: /hide details/i });
      expect(button).toHaveAttribute('aria-expanded', 'true');
    });
  });
```

**Step 2: Run tests to verify they fail**

Run: `pnpm --filter @bjj-poster/web test -- components/builder/tournament-info/__tests__/tournament-info-fields.test.tsx`

Expected: FAIL - Unable to find role="button"

**Step 3: Implement collapsible section with toggle button**

Update `apps/web/components/builder/tournament-info/tournament-info-fields.tsx` - replace the entire file:

```typescript
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { usePosterBuilderStore } from '@/lib/stores';
import { useDebouncedStoreSync } from '@/lib/hooks/use-debounced-store-sync';
import {
  tournamentInfoSchema,
  MAX_TOURNAMENT_LENGTH,
  MAX_LOCATION_LENGTH,
} from '@/lib/validations';

/** Type for field-specific errors */
interface FieldErrors {
  tournament?: string;
  location?: string;
}

/** Debounce delay in milliseconds for text field updates */
export const DEBOUNCE_MS = 300;

/**
 * Form fields for tournament information (name, date, location).
 * Features collapsible advanced section, debounced auto-save, and validation.
 */
export function TournamentInfoFields(): React.ReactElement {
  // Get state and actions from store with shallow comparison
  const {
    storeTournament,
    storeDate,
    storeLocation,
    showAdvancedOptions,
    setField,
    toggleAdvancedOptions,
  } = usePosterBuilderStore(
    useShallow((state) => ({
      storeTournament: state.tournament,
      storeDate: state.date,
      storeLocation: state.location,
      showAdvancedOptions: state.showAdvancedOptions,
      setField: state.setField,
      toggleAdvancedOptions: state.toggleAdvancedOptions,
    }))
  );

  // Local state for immediate UI updates
  const [tournament, setTournament] = useState(storeTournament);
  const [date, setDate] = useState(storeDate);
  const [location, setLocation] = useState(storeLocation);

  // Validation state
  const [errors, setErrors] = useState<FieldErrors>({});

  // Validate a single field using Zod schema
  const validateField = useCallback(
    (fieldName: 'tournament' | 'location', value: string): string | undefined => {
      const fieldSchema = tournamentInfoSchema.shape[fieldName];
      const result = fieldSchema.safeParse(value);
      if (!result.success) {
        return result.error.errors[0]?.message;
      }
      return undefined;
    },
    []
  );

  // Sync local state when store changes
  useEffect(() => {
    setTournament(storeTournament);
  }, [storeTournament]);

  useEffect(() => {
    setDate(storeDate);
  }, [storeDate]);

  useEffect(() => {
    setLocation(storeLocation);
  }, [storeLocation]);

  // Debounced sync to store for tournament name
  useDebouncedStoreSync(
    tournament,
    storeTournament,
    useCallback((value: string) => setField('tournament', value.trim()), [setField]),
    {
      delayMs: DEBOUNCE_MS,
      validate: useCallback(
        (value: string) => validateField('tournament', value),
        [validateField]
      ),
    }
  );

  // Debounced sync to store for location
  useDebouncedStoreSync(
    location,
    storeLocation,
    useCallback((value: string) => setField('location', value.trim()), [setField]),
    {
      delayMs: DEBOUNCE_MS,
      validate: useCallback(
        (value: string) => validateField('location', value),
        [validateField]
      ),
    }
  );

  // Tournament name handlers
  const handleTournamentChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setTournament(value);
      if (errors.tournament && value.trim().length > 0 && value.length <= MAX_TOURNAMENT_LENGTH) {
        setErrors((prev) => ({ ...prev, tournament: undefined }));
      }
    },
    [errors.tournament]
  );

  const handleTournamentBlur = useCallback(() => {
    const error = validateField('tournament', tournament);
    setErrors((prev) => ({ ...prev, tournament: error }));
  }, [tournament, validateField]);

  // Date handler - syncs immediately (discrete selection)
  const handleDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setDate(value);
      setField('date', value);
    },
    [setField]
  );

  // Location handlers
  const handleLocationChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setLocation(value);
      if (errors.location && value.length <= MAX_LOCATION_LENGTH) {
        setErrors((prev) => ({ ...prev, location: undefined }));
      }
    },
    [errors.location]
  );

  const handleLocationBlur = useCallback(() => {
    const error = validateField('location', location);
    setErrors((prev) => ({ ...prev, location: error }));
  }, [location, validateField]);

  return (
    <div className="space-y-4">
      {/* Tournament Name */}
      <div className="space-y-2">
        <Label htmlFor="tournament-name">
          Tournament Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="tournament-name"
          type="text"
          placeholder="Enter tournament name"
          value={tournament}
          onChange={handleTournamentChange}
          onBlur={handleTournamentBlur}
          aria-required="true"
          aria-invalid={!!errors.tournament}
          aria-describedby={errors.tournament ? 'tournament-name-error' : undefined}
        />
        {errors.tournament && (
          <p id="tournament-name-error" className="text-sm text-destructive">
            {errors.tournament}
          </p>
        )}
      </div>

      {/* Toggle Button */}
      <button
        type="button"
        onClick={toggleAdvancedOptions}
        aria-expanded={showAdvancedOptions}
        aria-controls="advanced-fields"
        className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
      >
        {showAdvancedOptions ? '➖ Hide details' : '➕ Add more details'}
      </button>

      {/* Collapsible Advanced Section */}
      <div
        id="advanced-fields"
        className={cn(
          'grid transition-[grid-template-rows] duration-300 ease-out',
          showAdvancedOptions ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        )}
      >
        <div className="overflow-hidden">
          <div className="space-y-4 pt-2">
            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="tournament-date">
                Date <span className="text-muted-foreground text-sm">(Optional)</span>
              </Label>
              <Input
                id="tournament-date"
                type="date"
                value={date}
                onChange={handleDateChange}
              />
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="tournament-location">
                Location <span className="text-muted-foreground text-sm">(Optional)</span>
              </Label>
              <Input
                id="tournament-location"
                type="text"
                placeholder="Enter location"
                value={location}
                onChange={handleLocationChange}
                onBlur={handleLocationBlur}
                aria-invalid={!!errors.location}
                aria-describedby={errors.location ? 'tournament-location-error' : undefined}
              />
              {errors.location && (
                <p id="tournament-location-error" className="text-sm text-destructive">
                  {errors.location}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Step 4: Run tests to verify they pass**

Run: `pnpm --filter @bjj-poster/web test -- components/builder/tournament-info/__tests__/tournament-info-fields.test.tsx`

Expected: PASS (13 tests)

**Step 5: Commit**

```bash
git add apps/web/components/builder/tournament-info/
git commit -m "feat(builder): add collapsible advanced section with date/location"
```

---

## Task 6: Test Store Integration and Auto-Save

**Files:**
- Modify: `apps/web/components/builder/tournament-info/__tests__/tournament-info-fields.test.tsx`

**Step 1: Write tests for store integration**

Add to the test file:

```typescript
  describe('store integration', () => {
    it('initializes fields from store values', () => {
      vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
        const state = createMockState({
          tournament: 'IBJJF Worlds',
          date: '2026-06-15',
          location: 'Las Vegas',
          showAdvancedOptions: true,
        });
        return selector ? selector(state) : state;
      });

      render(<TournamentInfoFields />);

      expect(screen.getByLabelText(/tournament name/i)).toHaveValue('IBJJF Worlds');
      expect(screen.getByLabelText(/date/i)).toHaveValue('2026-06-15');
      expect(screen.getByLabelText(/location/i)).toHaveValue('Las Vegas');
    });

    it('debounces tournament name sync to store', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      const user = userEvent.setup({
        advanceTimers: (delay) => vi.advanceTimersByTime(delay),
      });
      const mockSetField = vi.fn();

      vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
        const state = createMockState({ setField: mockSetField });
        return selector ? selector(state) : state;
      });

      render(<TournamentInfoFields />);

      const input = screen.getByLabelText(/tournament name/i);
      await user.type(input, 'IBJJF');

      expect(mockSetField).not.toHaveBeenCalled();

      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      expect(mockSetField).toHaveBeenCalledWith('tournament', 'IBJJF');

      vi.useRealTimers();
    });

    it('syncs date to store immediately on change', async () => {
      const mockSetField = vi.fn();

      vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
        const state = createMockState({
          setField: mockSetField,
          showAdvancedOptions: true,
        });
        return selector ? selector(state) : state;
      });

      const user = userEvent.setup();
      render(<TournamentInfoFields />);

      const input = screen.getByLabelText(/date/i);
      await user.type(input, '2026-06-15');

      expect(mockSetField).toHaveBeenCalledWith('date', '2026-06-15');
    });

    it('debounces location sync to store', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      const user = userEvent.setup({
        advanceTimers: (delay) => vi.advanceTimersByTime(delay),
      });
      const mockSetField = vi.fn();

      vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
        const state = createMockState({
          setField: mockSetField,
          showAdvancedOptions: true,
        });
        return selector ? selector(state) : state;
      });

      render(<TournamentInfoFields />);

      const input = screen.getByLabelText(/location/i);
      await user.type(input, 'Vegas');

      expect(mockSetField).not.toHaveBeenCalledWith('location', expect.any(String));

      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      expect(mockSetField).toHaveBeenCalledWith('location', 'Vegas');

      vi.useRealTimers();
    });

    it('does not sync invalid tournament name to store', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      const user = userEvent.setup({
        advanceTimers: (delay) => vi.advanceTimersByTime(delay),
      });
      const mockSetField = vi.fn();

      vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
        const state = createMockState({ setField: mockSetField });
        return selector ? selector(state) : state;
      });

      render(<TournamentInfoFields />);

      const input = screen.getByLabelText(/tournament name/i);
      await user.type(input, 'A'.repeat(101));

      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      expect(mockSetField).not.toHaveBeenCalledWith('tournament', expect.any(String));

      vi.useRealTimers();
    });
  });
```

**Step 2: Run tests to verify they pass**

Run: `pnpm --filter @bjj-poster/web test -- components/builder/tournament-info/__tests__/tournament-info-fields.test.tsx`

Expected: PASS (18 tests)

**Step 3: Commit**

```bash
git add apps/web/components/builder/tournament-info/__tests__/
git commit -m "test(builder): add store integration and auto-save tests"
```

---

## Task 7: Test Location Validation

**Files:**
- Modify: `apps/web/components/builder/tournament-info/__tests__/tournament-info-fields.test.tsx`

**Step 1: Add location validation tests**

Add to the `validation` describe block:

```typescript
    it('shows error when location exceeds 100 characters', async () => {
      vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
        const state = createMockState({ showAdvancedOptions: true });
        return selector ? selector(state) : state;
      });

      const user = userEvent.setup();
      render(<TournamentInfoFields />);

      const input = screen.getByLabelText(/location/i);
      await user.type(input, 'A'.repeat(101));
      await user.tab();

      expect(screen.getByText('Location must be 100 characters or less')).toBeInTheDocument();
    });

    it('does not show error for empty location (optional)', async () => {
      vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
        const state = createMockState({ showAdvancedOptions: true });
        return selector ? selector(state) : state;
      });

      const user = userEvent.setup();
      render(<TournamentInfoFields />);

      const input = screen.getByLabelText(/location/i);
      await user.click(input);
      await user.tab();

      expect(screen.queryByText(/required/i)).not.toBeInTheDocument();
    });
```

**Step 2: Run tests to verify they pass**

Run: `pnpm --filter @bjj-poster/web test -- components/builder/tournament-info/__tests__/tournament-info-fields.test.tsx`

Expected: PASS (20 tests)

**Step 3: Commit**

```bash
git add apps/web/components/builder/tournament-info/__tests__/
git commit -m "test(builder): add location validation tests"
```

---

## Task 8: Run Full Test Suite and Type Check

**Step 1: Run all web tests**

Run: `pnpm --filter @bjj-poster/web test`

Expected: All tests pass

**Step 2: Run type check**

Run: `pnpm --filter @bjj-poster/web type-check`

Expected: No errors

**Step 3: Run linter**

Run: `pnpm --filter @bjj-poster/web lint`

Expected: No errors (or fix any issues)

**Step 4: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix(builder): address lint/type issues"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Validation schema | `tournament-info.ts`, tests |
| 2 | Component scaffold | Directory structure |
| 3 | Tournament name field | Component implementation |
| 4 | Tournament name validation | Test coverage |
| 5 | Collapsible toggle + date/location | Full component |
| 6 | Store integration tests | Auto-save tests |
| 7 | Location validation tests | Edge cases |
| 8 | Full test suite + quality | Final verification |
