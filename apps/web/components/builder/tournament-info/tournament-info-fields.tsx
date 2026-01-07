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
        <div
          className="overflow-hidden"
          style={{ visibility: showAdvancedOptions ? 'visible' : 'hidden' }}
        >
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
