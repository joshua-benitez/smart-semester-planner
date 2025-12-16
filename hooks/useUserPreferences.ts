'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { UserPreferences } from '@/types/user'

export function useUserPreferences() {
  // central cache for preference toggles so the UI stays consistent
  const queryClient = useQueryClient()

  const preferencesQuery = useQuery<UserPreferences>({
    queryKey: ['user', 'preferences'],
    queryFn: async () => {
      const res = await fetch('/api/user/preferences')
      if (!res.ok) throw new Error('Failed to fetch preferences')
      const payload = await res.json()
      if (!payload.ok) throw new Error(payload?.error?.message || 'Failed to fetch preferences')
      return payload.data as UserPreferences
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<UserPreferences>) => {
      const res = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!res.ok) throw new Error('Failed to update preferences')
      const payload = await res.json()
      if (!payload.ok) throw new Error(payload?.error?.message || 'Failed to update preferences')
      return payload.data as UserPreferences
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['user', 'preferences'], data)
    },
  })

  return {
    preferences: preferencesQuery.data,
    loading: preferencesQuery.isLoading,
    error: preferencesQuery.error,
    updatePreferences: (updates: Partial<UserPreferences>) => 
      updateMutation.mutateAsync(updates),
    isUpdating: updateMutation.isPending,
  }
}
