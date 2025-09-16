'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { StreakSummary } from '@/types/streaks'

export function useStreaks() {
  const qc = useQueryClient()

  const streaksQuery = useQuery<StreakSummary>({
    queryKey: ['streaks'],
    queryFn: async () => {
      const res = await fetch('/api/streaks')
      if (!res.ok) throw new Error('Failed to fetch streaks')
      return res.json()
    },
    staleTime: 60_000,
  })

  const checkInMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/streaks', { method: 'POST' })
      if (!res.ok) throw new Error('Failed to check in')
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['streaks'] }),
  })

  const undoMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/streaks', { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to undo check-in')
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['streaks'] }),
  })

  return {
    data: streaksQuery.data,
    loading: streaksQuery.isLoading,
    error: streaksQuery.isError ? 'Failed to load streaks' : null,
    checkIn: () => checkInMutation.mutateAsync(),
    undo: () => undoMutation.mutateAsync(),
  }
}

