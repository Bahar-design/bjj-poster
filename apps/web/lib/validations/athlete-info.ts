import { z } from 'zod';

/** Maximum length for athlete name field */
export const MAX_NAME_LENGTH = 50;

/** Maximum length for team field */
export const MAX_TEAM_LENGTH = 50;

/**
 * Athlete info validation schema.
 * Uses .trim() which both validates against trimmed values AND returns trimmed output.
 * Component must sync trimmed values to store to avoid local/store desync.
 */
export const athleteInfoSchema = z.object({
  athleteName: z
    .string()
    .trim()
    .min(1, 'Athlete name is required')
    .max(MAX_NAME_LENGTH, 'Name must be 50 characters or less'),
  beltRank: z.enum(['white', 'blue', 'purple', 'brown', 'black', 'red-black', 'red']),
  /** Team is optional - empty string is valid */
  team: z
    .string()
    .trim()
    .max(MAX_TEAM_LENGTH, 'Team must be 50 characters or less'),
});

export type AthleteInfoFormData = z.infer<typeof athleteInfoSchema>;
