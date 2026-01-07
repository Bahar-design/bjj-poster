# AthleteInfoFields Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create form fields for athlete name, belt rank, and team with Zod validation, debounced auto-save to Zustand store, and localStorage persistence.

**Architecture:** Single `AthleteInfoFields` component using shadcn/ui Input and Select components. Local state for immediate UI response, debounced sync to Zustand store. Validation via Zod schema triggered on blur.

**Tech Stack:** React, Zustand, Zod, shadcn/ui (Input, Select, Label), Tailwind CSS

---

## Task 0: Add shadcn/ui Label Component

**Files:**
- Create: `apps/web/components/ui/label.tsx`
- Modify: `apps/web/components/ui/index.ts`

**Step 1: Add Label component using shadcn CLI**

Run: `cd /home/bahar/bjj-poster && pnpm dlx shadcn@latest add label --yes`

Expected: Label component created at `apps/web/components/ui/label.tsx`

**Step 2: Verify component exists**

Run: `cat apps/web/components/ui/label.tsx | head -20`

Expected: File contains React.forwardRef with Label component

**Step 3: Commit**

```bash
git add apps/web/components/ui/label.tsx apps/web/components/ui/index.ts
git commit -m "feat(ui): add shadcn Label component"
```

---

## Task 1: Update BeltRank Type in Store

The existing store only has 5 belt ranks. Add red-black and red belts.

**Files:**
- Modify: `apps/web/lib/stores/poster-builder-store.ts:5`

**Step 1: Write the failing test**

Create: `apps/web/lib/stores/__tests__/belt-rank.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import type { BeltRank } from '../poster-builder-store';

describe('BeltRank type', () => {
  it('accepts all 7 BJJ belt ranks', () => {
    const belts: BeltRank[] = [
      'white',
      'blue',
      'purple',
      'brown',
      'black',
      'red-black',
      'red',
    ];

    expect(belts).toHaveLength(7);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @bjj-poster/web test -- lib/stores/__tests__/belt-rank.test.ts`

Expected: FAIL - Type error for 'red-black' and 'red' not assignable to BeltRank

**Step 3: Update BeltRank type**

In `apps/web/lib/stores/poster-builder-store.ts`, change line 5:

```typescript
// OLD:
export type BeltRank = 'white' | 'blue' | 'purple' | 'brown' | 'black';

// NEW:
export type BeltRank = 'white' | 'blue' | 'purple' | 'brown' | 'black' | 'red-black' | 'red';
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @bjj-poster/web test -- lib/stores/__tests__/belt-rank.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/lib/stores/poster-builder-store.ts apps/web/lib/stores/__tests__/belt-rank.test.ts
git commit -m "feat(store): add red-black and red belt ranks"
```

---

## Task 2: Create Athlete Info Validation Schema

**Files:**
- Create: `apps/web/lib/validations/athlete-info.ts`
- Modify: `apps/web/lib/validations/index.ts`
- Test: `apps/web/lib/validations/__tests__/athlete-info.test.ts`

**Step 1: Write the failing test**

Create: `apps/web/lib/validations/__tests__/athlete-info.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { athleteInfoSchema } from '../athlete-info';

describe('athleteInfoSchema', () => {
  describe('athleteName', () => {
    it('requires athlete name', () => {
      const result = athleteInfoSchema.safeParse({
        athleteName: '',
        beltRank: 'white',
        team: '',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Athlete name is required');
      }
    });

    it('rejects names over 50 characters', () => {
      const result = athleteInfoSchema.safeParse({
        athleteName: 'A'.repeat(51),
        beltRank: 'white',
        team: '',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Name must be 50 characters or less');
      }
    });

    it('accepts valid name', () => {
      const result = athleteInfoSchema.safeParse({
        athleteName: 'John Doe',
        beltRank: 'white',
        team: '',
      });

      expect(result.success).toBe(true);
    });

    it('trims whitespace before validation', () => {
      const result = athleteInfoSchema.safeParse({
        athleteName: '   ',
        beltRank: 'white',
        team: '',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('beltRank', () => {
    it('accepts all valid belt ranks', () => {
      const belts = ['white', 'blue', 'purple', 'brown', 'black', 'red-black', 'red'];

      belts.forEach((belt) => {
        const result = athleteInfoSchema.safeParse({
          athleteName: 'John',
          beltRank: belt,
          team: '',
        });

        expect(result.success).toBe(true);
      });
    });

    it('rejects invalid belt rank', () => {
      const result = athleteInfoSchema.safeParse({
        athleteName: 'John',
        beltRank: 'green',
        team: '',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('team', () => {
    it('allows empty team (optional)', () => {
      const result = athleteInfoSchema.safeParse({
        athleteName: 'John',
        beltRank: 'white',
        team: '',
      });

      expect(result.success).toBe(true);
    });

    it('rejects team over 50 characters', () => {
      const result = athleteInfoSchema.safeParse({
        athleteName: 'John',
        beltRank: 'white',
        team: 'A'.repeat(51),
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Team must be 50 characters or less');
      }
    });

    it('accepts valid team name', () => {
      const result = athleteInfoSchema.safeParse({
        athleteName: 'John',
        beltRank: 'white',
        team: 'Gracie Barra',
      });

      expect(result.success).toBe(true);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @bjj-poster/web test -- lib/validations/__tests__/athlete-info.test.ts`

Expected: FAIL - Cannot find module '../athlete-info'

**Step 3: Create validation schema**

Create: `apps/web/lib/validations/athlete-info.ts`

```typescript
import { z } from 'zod';

export const athleteInfoSchema = z.object({
  athleteName: z
    .string()
    .trim()
    .min(1, 'Athlete name is required')
    .max(50, 'Name must be 50 characters or less'),
  beltRank: z.enum(['white', 'blue', 'purple', 'brown', 'black', 'red-black', 'red']),
  team: z
    .string()
    .max(50, 'Team must be 50 characters or less')
    .optional()
    .or(z.literal('')),
});

export type AthleteInfoFormData = z.infer<typeof athleteInfoSchema>;
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @bjj-poster/web test -- lib/validations/__tests__/athlete-info.test.ts`

Expected: PASS (all 9 tests)

**Step 5: Add export to validations index**

Modify: `apps/web/lib/validations/index.ts`

```typescript
export {
  loginSchema,
  signupSchema,
  type LoginFormData,
  type SignupFormData,
} from './auth';

export { athleteInfoSchema, type AthleteInfoFormData } from './athlete-info';
```

**Step 6: Commit**

```bash
git add apps/web/lib/validations/athlete-info.ts apps/web/lib/validations/__tests__/athlete-info.test.ts apps/web/lib/validations/index.ts
git commit -m "feat(validation): add athlete info schema with Zod"
```

---

## Task 3: Create AthleteInfoFields Component - Structure

**Files:**
- Create: `apps/web/components/builder/athlete-info/athlete-info-fields.tsx`
- Create: `apps/web/components/builder/athlete-info/index.ts`
- Test: `apps/web/components/builder/athlete-info/__tests__/athlete-info-fields.test.tsx`

**Step 1: Write the failing test for rendering**

Create: `apps/web/components/builder/athlete-info/__tests__/athlete-info-fields.test.tsx`

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AthleteInfoFields } from '../athlete-info-fields';

// Mock the store
vi.mock('@/lib/stores', () => ({
  usePosterBuilderStore: vi.fn((selector) => {
    const state = {
      athleteName: '',
      beltRank: 'white',
      team: '',
      setField: vi.fn(),
    };
    return selector ? selector(state) : state;
  }),
}));

describe('AthleteInfoFields', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders athlete name input with label', () => {
      render(<AthleteInfoFields />);

      expect(screen.getByLabelText(/athlete name/i)).toBeInTheDocument();
    });

    it('renders belt rank select with label', () => {
      render(<AthleteInfoFields />);

      expect(screen.getByLabelText(/belt rank/i)).toBeInTheDocument();
    });

    it('renders team input with optional label', () => {
      render(<AthleteInfoFields />);

      expect(screen.getByLabelText(/team/i)).toBeInTheDocument();
      expect(screen.getByText(/optional/i)).toBeInTheDocument();
    });

    it('marks required fields with asterisk', () => {
      render(<AthleteInfoFields />);

      const athleteLabel = screen.getByText(/athlete name/i).closest('label');
      const beltLabel = screen.getByText(/belt rank/i).closest('label');

      expect(athleteLabel).toHaveTextContent('*');
      expect(beltLabel).toHaveTextContent('*');
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @bjj-poster/web test -- components/builder/athlete-info/__tests__/athlete-info-fields.test.tsx`

Expected: FAIL - Cannot find module '../athlete-info-fields'

**Step 3: Create basic component structure**

Create: `apps/web/components/builder/athlete-info/athlete-info-fields.tsx`

```typescript
'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function AthleteInfoFields(): React.ReactElement {
  return (
    <div className="space-y-4">
      {/* Athlete Name */}
      <div className="space-y-2">
        <Label htmlFor="athlete-name">
          Athlete Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="athlete-name"
          type="text"
          placeholder="Enter athlete name"
          maxLength={50}
        />
      </div>

      {/* Belt Rank */}
      <div className="space-y-2">
        <Label htmlFor="belt-rank">
          Belt Rank <span className="text-destructive">*</span>
        </Label>
        <Select defaultValue="white">
          <SelectTrigger id="belt-rank">
            <SelectValue placeholder="Select belt rank" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="white">White</SelectItem>
            <SelectItem value="blue">Blue</SelectItem>
            <SelectItem value="purple">Purple</SelectItem>
            <SelectItem value="brown">Brown</SelectItem>
            <SelectItem value="black">Black</SelectItem>
            <SelectItem value="red-black">Red/Black</SelectItem>
            <SelectItem value="red">Red</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Team */}
      <div className="space-y-2">
        <Label htmlFor="team">
          Team <span className="text-muted-foreground text-sm">(Optional)</span>
        </Label>
        <Input
          id="team"
          type="text"
          placeholder="Enter team name"
          maxLength={50}
        />
      </div>
    </div>
  );
}
```

**Step 4: Create index export**

Create: `apps/web/components/builder/athlete-info/index.ts`

```typescript
export { AthleteInfoFields } from './athlete-info-fields';
```

**Step 5: Run test to verify it passes**

Run: `pnpm --filter @bjj-poster/web test -- components/builder/athlete-info/__tests__/athlete-info-fields.test.tsx`

Expected: PASS (all 4 tests)

**Step 6: Commit**

```bash
git add apps/web/components/builder/athlete-info/
git commit -m "feat(builder): add AthleteInfoFields component structure"
```

---

## Task 4: Add Belt Color Indicators

**Files:**
- Modify: `apps/web/components/builder/athlete-info/athlete-info-fields.tsx`
- Test: `apps/web/components/builder/athlete-info/__tests__/athlete-info-fields.test.tsx`

**Step 1: Add test for belt color indicators**

Add to `athlete-info-fields.test.tsx` in the `describe('rendering')` block:

```typescript
    it('renders belt rank dropdown with all 7 belt options', async () => {
      const user = userEvent.setup();
      render(<AthleteInfoFields />);

      // Open the dropdown
      await user.click(screen.getByRole('combobox', { name: /belt rank/i }));

      // Check all options are present
      expect(screen.getByRole('option', { name: /white/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /blue/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /purple/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /brown/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /black/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /red\/black/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /^red$/i })).toBeInTheDocument();
    });

    it('renders color indicator for each belt option', async () => {
      const user = userEvent.setup();
      render(<AthleteInfoFields />);

      await user.click(screen.getByRole('combobox', { name: /belt rank/i }));

      // Check color indicators exist
      const options = screen.getAllByRole('option');
      options.forEach((option) => {
        expect(option.querySelector('[data-testid="belt-color"]')).toBeInTheDocument();
      });
    });
```

Also add this import at the top:

```typescript
import userEvent from '@testing-library/user-event';
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @bjj-poster/web test -- components/builder/athlete-info/__tests__/athlete-info-fields.test.tsx`

Expected: FAIL - Unable to find role="option" or data-testid="belt-color"

**Step 3: Add belt color configuration and indicators**

Update `apps/web/components/builder/athlete-info/athlete-info-fields.tsx`:

```typescript
'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

/** Belt rank configuration with display names and colors */
const BELT_OPTIONS = [
  { value: 'white', label: 'White', colorClass: 'bg-gray-100 border border-gray-300' },
  { value: 'blue', label: 'Blue', colorClass: 'bg-blue-600' },
  { value: 'purple', label: 'Purple', colorClass: 'bg-purple-600' },
  { value: 'brown', label: 'Brown', colorClass: 'bg-amber-800' },
  { value: 'black', label: 'Black', colorClass: 'bg-black' },
  { value: 'red-black', label: 'Red/Black', colorClass: 'bg-gradient-to-r from-red-600 to-black' },
  { value: 'red', label: 'Red', colorClass: 'bg-red-600' },
] as const;

export function AthleteInfoFields(): React.ReactElement {
  return (
    <div className="space-y-4">
      {/* Athlete Name */}
      <div className="space-y-2">
        <Label htmlFor="athlete-name">
          Athlete Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="athlete-name"
          type="text"
          placeholder="Enter athlete name"
          maxLength={50}
        />
      </div>

      {/* Belt Rank */}
      <div className="space-y-2">
        <Label htmlFor="belt-rank">
          Belt Rank <span className="text-destructive">*</span>
        </Label>
        <Select defaultValue="white">
          <SelectTrigger id="belt-rank">
            <SelectValue placeholder="Select belt rank" />
          </SelectTrigger>
          <SelectContent>
            {BELT_OPTIONS.map((belt) => (
              <SelectItem key={belt.value} value={belt.value}>
                <div className="flex items-center gap-2">
                  <span
                    data-testid="belt-color"
                    className={cn('h-3 w-3 rounded-full shrink-0', belt.colorClass)}
                    aria-hidden="true"
                  />
                  <span>{belt.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Team */}
      <div className="space-y-2">
        <Label htmlFor="team">
          Team <span className="text-muted-foreground text-sm">(Optional)</span>
        </Label>
        <Input
          id="team"
          type="text"
          placeholder="Enter team name"
          maxLength={50}
        />
      </div>
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @bjj-poster/web test -- components/builder/athlete-info/__tests__/athlete-info-fields.test.tsx`

Expected: PASS (all 6 tests)

**Step 5: Commit**

```bash
git add apps/web/components/builder/athlete-info/athlete-info-fields.tsx apps/web/components/builder/athlete-info/__tests__/athlete-info-fields.test.tsx
git commit -m "feat(builder): add belt color indicators to dropdown"
```

---

## Task 5: Wire Up Store Integration

**Files:**
- Modify: `apps/web/components/builder/athlete-info/athlete-info-fields.tsx`
- Test: `apps/web/components/builder/athlete-info/__tests__/athlete-info-fields.test.tsx`

**Step 1: Add tests for store integration**

Add to `athlete-info-fields.test.tsx`:

```typescript
  describe('store integration', () => {
    it('initializes fields from store values', () => {
      // Override mock for this test
      vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
        const state = {
          athleteName: 'John Doe',
          beltRank: 'purple',
          team: 'Gracie Barra',
          setField: vi.fn(),
        };
        return selector ? selector(state) : state;
      });

      render(<AthleteInfoFields />);

      expect(screen.getByLabelText(/athlete name/i)).toHaveValue('John Doe');
      expect(screen.getByLabelText(/team/i)).toHaveValue('Gracie Barra');
    });

    it('calls setField when athlete name changes after debounce', async () => {
      vi.useFakeTimers();
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const mockSetField = vi.fn();

      vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
        const state = {
          athleteName: '',
          beltRank: 'white',
          team: '',
          setField: mockSetField,
        };
        return selector ? selector(state) : state;
      });

      render(<AthleteInfoFields />);

      const input = screen.getByLabelText(/athlete name/i);
      await user.type(input, 'Jane');

      // Before debounce, setField should not be called
      expect(mockSetField).not.toHaveBeenCalled();

      // Fast-forward 300ms
      vi.advanceTimersByTime(300);

      expect(mockSetField).toHaveBeenCalledWith('athleteName', 'Jane');

      vi.useRealTimers();
    });

    it('calls setField immediately when belt rank changes', async () => {
      const user = userEvent.setup();
      const mockSetField = vi.fn();

      vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
        const state = {
          athleteName: '',
          beltRank: 'white',
          team: '',
          setField: mockSetField,
        };
        return selector ? selector(state) : state;
      });

      render(<AthleteInfoFields />);

      await user.click(screen.getByRole('combobox', { name: /belt rank/i }));
      await user.click(screen.getByRole('option', { name: /purple/i }));

      expect(mockSetField).toHaveBeenCalledWith('beltRank', 'purple');
    });

    it('calls setField when team changes after debounce', async () => {
      vi.useFakeTimers();
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const mockSetField = vi.fn();

      vi.mocked(usePosterBuilderStore).mockImplementation((selector) => {
        const state = {
          athleteName: '',
          beltRank: 'white',
          team: '',
          setField: mockSetField,
        };
        return selector ? selector(state) : state;
      });

      render(<AthleteInfoFields />);

      const input = screen.getByLabelText(/team/i);
      await user.type(input, 'Alliance');

      vi.advanceTimersByTime(300);

      expect(mockSetField).toHaveBeenCalledWith('team', 'Alliance');

      vi.useRealTimers();
    });
  });
```

Also add import:

```typescript
import { usePosterBuilderStore } from '@/lib/stores';
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @bjj-poster/web test -- components/builder/athlete-info/__tests__/athlete-info-fields.test.tsx`

Expected: FAIL - inputs don't have values, setField not called

**Step 3: Wire up store with debounced updates**

Update `apps/web/components/builder/athlete-info/athlete-info-fields.tsx`:

```typescript
'use client';

import { useCallback, useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { usePosterBuilderStore, type BeltRank } from '@/lib/stores';

/** Belt rank configuration with display names and colors */
const BELT_OPTIONS = [
  { value: 'white', label: 'White', colorClass: 'bg-gray-100 border border-gray-300' },
  { value: 'blue', label: 'Blue', colorClass: 'bg-blue-600' },
  { value: 'purple', label: 'Purple', colorClass: 'bg-purple-600' },
  { value: 'brown', label: 'Brown', colorClass: 'bg-amber-800' },
  { value: 'black', label: 'Black', colorClass: 'bg-black' },
  { value: 'red-black', label: 'Red/Black', colorClass: 'bg-gradient-to-r from-red-600 to-black' },
  { value: 'red', label: 'Red', colorClass: 'bg-red-600' },
] as const;

const DEBOUNCE_MS = 300;

export function AthleteInfoFields(): React.ReactElement {
  // Get store values and setter
  const storeAthleteName = usePosterBuilderStore((state) => state.athleteName);
  const storeBeltRank = usePosterBuilderStore((state) => state.beltRank);
  const storeTeam = usePosterBuilderStore((state) => state.team);
  const setField = usePosterBuilderStore((state) => state.setField);

  // Local state for immediate UI response
  const [athleteName, setAthleteName] = useState(storeAthleteName);
  const [team, setTeam] = useState(storeTeam);

  // Sync local state when store changes (e.g., rehydration)
  useEffect(() => {
    setAthleteName(storeAthleteName);
  }, [storeAthleteName]);

  useEffect(() => {
    setTeam(storeTeam);
  }, [storeTeam]);

  // Debounced sync to store for text fields
  useEffect(() => {
    const timer = setTimeout(() => {
      if (athleteName !== storeAthleteName) {
        setField('athleteName', athleteName);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [athleteName, storeAthleteName, setField]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (team !== storeTeam) {
        setField('team', team);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [team, storeTeam, setField]);

  // Belt rank updates immediately (no debounce needed for select)
  const handleBeltChange = useCallback(
    (value: string) => {
      setField('beltRank', value as BeltRank);
    },
    [setField]
  );

  return (
    <div className="space-y-4">
      {/* Athlete Name */}
      <div className="space-y-2">
        <Label htmlFor="athlete-name">
          Athlete Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="athlete-name"
          type="text"
          placeholder="Enter athlete name"
          maxLength={50}
          value={athleteName}
          onChange={(e) => setAthleteName(e.target.value)}
        />
      </div>

      {/* Belt Rank */}
      <div className="space-y-2">
        <Label htmlFor="belt-rank">
          Belt Rank <span className="text-destructive">*</span>
        </Label>
        <Select value={storeBeltRank} onValueChange={handleBeltChange}>
          <SelectTrigger id="belt-rank">
            <SelectValue placeholder="Select belt rank" />
          </SelectTrigger>
          <SelectContent>
            {BELT_OPTIONS.map((belt) => (
              <SelectItem key={belt.value} value={belt.value}>
                <div className="flex items-center gap-2">
                  <span
                    data-testid="belt-color"
                    className={cn('h-3 w-3 rounded-full shrink-0', belt.colorClass)}
                    aria-hidden="true"
                  />
                  <span>{belt.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Team */}
      <div className="space-y-2">
        <Label htmlFor="team">
          Team <span className="text-muted-foreground text-sm">(Optional)</span>
        </Label>
        <Input
          id="team"
          type="text"
          placeholder="Enter team name"
          maxLength={50}
          value={team}
          onChange={(e) => setTeam(e.target.value)}
        />
      </div>
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @bjj-poster/web test -- components/builder/athlete-info/__tests__/athlete-info-fields.test.tsx`

Expected: PASS (all 10 tests)

**Step 5: Commit**

```bash
git add apps/web/components/builder/athlete-info/athlete-info-fields.tsx apps/web/components/builder/athlete-info/__tests__/athlete-info-fields.test.tsx
git commit -m "feat(builder): wire AthleteInfoFields to Zustand store with debounce"
```

---

## Task 6: Add Validation and Error Display

**Files:**
- Modify: `apps/web/components/builder/athlete-info/athlete-info-fields.tsx`
- Test: `apps/web/components/builder/athlete-info/__tests__/athlete-info-fields.test.tsx`

**Step 1: Add validation tests**

Add to `athlete-info-fields.test.tsx`:

```typescript
  describe('validation', () => {
    it('shows error when athlete name is empty on blur', async () => {
      const user = userEvent.setup();
      render(<AthleteInfoFields />);

      const input = screen.getByLabelText(/athlete name/i);
      await user.click(input);
      await user.tab(); // Blur

      expect(screen.getByText('Athlete name is required')).toBeInTheDocument();
    });

    it('shows error when athlete name exceeds 50 characters', async () => {
      const user = userEvent.setup();
      render(<AthleteInfoFields />);

      const input = screen.getByLabelText(/athlete name/i);
      await user.type(input, 'A'.repeat(51));
      await user.tab();

      expect(screen.getByText('Name must be 50 characters or less')).toBeInTheDocument();
    });

    it('clears error when user starts typing valid input', async () => {
      const user = userEvent.setup();
      render(<AthleteInfoFields />);

      const input = screen.getByLabelText(/athlete name/i);
      await user.click(input);
      await user.tab();

      expect(screen.getByText('Athlete name is required')).toBeInTheDocument();

      await user.type(input, 'John');

      expect(screen.queryByText('Athlete name is required')).not.toBeInTheDocument();
    });

    it('shows error when team exceeds 50 characters', async () => {
      const user = userEvent.setup();
      render(<AthleteInfoFields />);

      const input = screen.getByLabelText(/team/i);
      await user.type(input, 'A'.repeat(51));
      await user.tab();

      expect(screen.getByText('Team must be 50 characters or less')).toBeInTheDocument();
    });

    it('does not show error for empty team (optional)', async () => {
      const user = userEvent.setup();
      render(<AthleteInfoFields />);

      const input = screen.getByLabelText(/team/i);
      await user.click(input);
      await user.tab();

      expect(screen.queryByText(/team/i)).not.toHaveTextContent('required');
    });

    it('sets aria-invalid on input with error', async () => {
      const user = userEvent.setup();
      render(<AthleteInfoFields />);

      const input = screen.getByLabelText(/athlete name/i);
      await user.click(input);
      await user.tab();

      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('links error message with aria-describedby', async () => {
      const user = userEvent.setup();
      render(<AthleteInfoFields />);

      const input = screen.getByLabelText(/athlete name/i);
      await user.click(input);
      await user.tab();

      const errorId = input.getAttribute('aria-describedby');
      expect(errorId).toBeTruthy();
      expect(document.getElementById(errorId!)).toHaveTextContent('Athlete name is required');
    });
  });
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @bjj-poster/web test -- components/builder/athlete-info/__tests__/athlete-info-fields.test.tsx`

Expected: FAIL - No error messages rendered

**Step 3: Add validation logic and error display**

Update `apps/web/components/builder/athlete-info/athlete-info-fields.tsx`:

```typescript
'use client';

import { useCallback, useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { usePosterBuilderStore, type BeltRank } from '@/lib/stores';
import { athleteInfoSchema } from '@/lib/validations';

/** Belt rank configuration with display names and colors */
const BELT_OPTIONS = [
  { value: 'white', label: 'White', colorClass: 'bg-gray-100 border border-gray-300' },
  { value: 'blue', label: 'Blue', colorClass: 'bg-blue-600' },
  { value: 'purple', label: 'Purple', colorClass: 'bg-purple-600' },
  { value: 'brown', label: 'Brown', colorClass: 'bg-amber-800' },
  { value: 'black', label: 'Black', colorClass: 'bg-black' },
  { value: 'red-black', label: 'Red/Black', colorClass: 'bg-gradient-to-r from-red-600 to-black' },
  { value: 'red', label: 'Red', colorClass: 'bg-red-600' },
] as const;

const DEBOUNCE_MS = 300;

interface FieldErrors {
  athleteName?: string;
  team?: string;
}

export function AthleteInfoFields(): React.ReactElement {
  // Get store values and setter
  const storeAthleteName = usePosterBuilderStore((state) => state.athleteName);
  const storeBeltRank = usePosterBuilderStore((state) => state.beltRank);
  const storeTeam = usePosterBuilderStore((state) => state.team);
  const setField = usePosterBuilderStore((state) => state.setField);

  // Local state for immediate UI response
  const [athleteName, setAthleteName] = useState(storeAthleteName);
  const [team, setTeam] = useState(storeTeam);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Sync local state when store changes (e.g., rehydration)
  useEffect(() => {
    setAthleteName(storeAthleteName);
  }, [storeAthleteName]);

  useEffect(() => {
    setTeam(storeTeam);
  }, [storeTeam]);

  // Debounced sync to store for text fields
  useEffect(() => {
    const timer = setTimeout(() => {
      if (athleteName !== storeAthleteName) {
        setField('athleteName', athleteName);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [athleteName, storeAthleteName, setField]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (team !== storeTeam) {
        setField('team', team);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [team, storeTeam, setField]);

  // Validate a single field
  const validateField = useCallback(
    (fieldName: 'athleteName' | 'team', value: string) => {
      const result = athleteInfoSchema.shape[fieldName].safeParse(value);

      if (!result.success) {
        return result.error.issues[0].message;
      }
      return undefined;
    },
    []
  );

  // Clear error on change (optimistic)
  const handleAthleteNameChange = useCallback((value: string) => {
    setAthleteName(value);
    if (value.trim()) {
      setErrors((prev) => ({ ...prev, athleteName: undefined }));
    }
  }, []);

  const handleTeamChange = useCallback((value: string) => {
    setTeam(value);
    if (value.length <= 50) {
      setErrors((prev) => ({ ...prev, team: undefined }));
    }
  }, []);

  // Validate on blur
  const handleAthleteNameBlur = useCallback(() => {
    setTouched((prev) => ({ ...prev, athleteName: true }));
    const error = validateField('athleteName', athleteName);
    setErrors((prev) => ({ ...prev, athleteName: error }));
  }, [athleteName, validateField]);

  const handleTeamBlur = useCallback(() => {
    setTouched((prev) => ({ ...prev, team: true }));
    const error = validateField('team', team);
    setErrors((prev) => ({ ...prev, team: error }));
  }, [team, validateField]);

  // Belt rank updates immediately (no debounce needed for select)
  const handleBeltChange = useCallback(
    (value: string) => {
      setField('beltRank', value as BeltRank);
    },
    [setField]
  );

  const athleteNameError = touched.athleteName ? errors.athleteName : undefined;
  const teamError = touched.team ? errors.team : undefined;

  return (
    <div className="space-y-4">
      {/* Athlete Name */}
      <div className="space-y-2">
        <Label htmlFor="athlete-name">
          Athlete Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="athlete-name"
          type="text"
          placeholder="Enter athlete name"
          maxLength={50}
          value={athleteName}
          onChange={(e) => handleAthleteNameChange(e.target.value)}
          onBlur={handleAthleteNameBlur}
          aria-required="true"
          aria-invalid={!!athleteNameError}
          aria-describedby={athleteNameError ? 'athlete-name-error' : undefined}
        />
        {athleteNameError && (
          <p id="athlete-name-error" className="text-sm text-destructive">
            {athleteNameError}
          </p>
        )}
      </div>

      {/* Belt Rank */}
      <div className="space-y-2">
        <Label htmlFor="belt-rank">
          Belt Rank <span className="text-destructive">*</span>
        </Label>
        <Select value={storeBeltRank} onValueChange={handleBeltChange}>
          <SelectTrigger id="belt-rank" aria-required="true">
            <SelectValue placeholder="Select belt rank" />
          </SelectTrigger>
          <SelectContent>
            {BELT_OPTIONS.map((belt) => (
              <SelectItem key={belt.value} value={belt.value}>
                <div className="flex items-center gap-2">
                  <span
                    data-testid="belt-color"
                    className={cn('h-3 w-3 rounded-full shrink-0', belt.colorClass)}
                    aria-hidden="true"
                  />
                  <span>{belt.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Team */}
      <div className="space-y-2">
        <Label htmlFor="team">
          Team <span className="text-muted-foreground text-sm">(Optional)</span>
        </Label>
        <Input
          id="team"
          type="text"
          placeholder="Enter team name"
          maxLength={50}
          value={team}
          onChange={(e) => handleTeamChange(e.target.value)}
          onBlur={handleTeamBlur}
          aria-invalid={!!teamError}
          aria-describedby={teamError ? 'team-error' : undefined}
        />
        {teamError && (
          <p id="team-error" className="text-sm text-destructive">
            {teamError}
          </p>
        )}
      </div>
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @bjj-poster/web test -- components/builder/athlete-info/__tests__/athlete-info-fields.test.tsx`

Expected: PASS (all 17 tests)

**Step 5: Commit**

```bash
git add apps/web/components/builder/athlete-info/athlete-info-fields.tsx apps/web/components/builder/athlete-info/__tests__/athlete-info-fields.test.tsx
git commit -m "feat(builder): add validation and error display to AthleteInfoFields"
```

---

## Task 7: Export from Builder Components

**Files:**
- Modify: `apps/web/components/builder/index.ts`

**Step 1: Add export**

In `apps/web/components/builder/index.ts`, add:

```typescript
export { AthleteInfoFields } from './athlete-info';
```

**Step 2: Verify export works**

Run: `pnpm --filter @bjj-poster/web type-check`

Expected: No errors

**Step 3: Commit**

```bash
git add apps/web/components/builder/index.ts
git commit -m "feat(builder): export AthleteInfoFields from builder components"
```

---

## Task 8: Run Full Quality Checks

**Step 1: Run all tests**

Run: `pnpm --filter @bjj-poster/web test`

Expected: All tests pass

**Step 2: Run linter**

Run: `pnpm --filter @bjj-poster/web lint`

Expected: No errors

**Step 3: Run type check**

Run: `pnpm --filter @bjj-poster/web type-check`

Expected: No errors

**Step 4: Fix any issues found**

If any issues, fix and re-run checks.

**Step 5: Final commit if fixes needed**

```bash
git add -A
git commit -m "fix(builder): address lint and type check issues"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 0 | Add shadcn Label component | `components/ui/label.tsx` |
| 1 | Update BeltRank type | `lib/stores/poster-builder-store.ts` |
| 2 | Create Zod validation schema | `lib/validations/athlete-info.ts` |
| 3 | Create component structure | `components/builder/athlete-info/` |
| 4 | Add belt color indicators | Same component |
| 5 | Wire up store with debounce | Same component |
| 6 | Add validation and errors | Same component |
| 7 | Export from builder | `components/builder/index.ts` |
| 8 | Quality checks | All files |
