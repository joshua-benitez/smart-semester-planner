import { z } from 'zod'

export const UserPreferencesSchema = z.object({
  hideCompletedAssignments: z.boolean().optional(),
  theme: z.enum(['light', 'dark']).optional(),
  defaultAssignmentType: z.string().optional(),
  defaultDifficulty: z.string().optional(),
})

// eslint-disable-next-line @typescript-eslint/no-redeclare
export type UserPreferences = z.infer<typeof UserPreferencesSchema>

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  hideCompletedAssignments: false,
  theme: 'dark',
  defaultAssignmentType: 'homework',
  defaultDifficulty: 'moderate',
}
