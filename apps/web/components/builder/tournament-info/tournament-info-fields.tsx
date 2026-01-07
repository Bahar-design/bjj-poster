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
