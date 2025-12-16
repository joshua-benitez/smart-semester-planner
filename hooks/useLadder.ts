'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { LadderSummary, LadderUpdatePayload } from '@/types/ladder'

const LADDER_QUERY_KEY = ['ladder']

export function useLadder() {
  // shared hook so every component talks to the same ladder cache
  const qc = useQueryClient()

  const ladderQuery = useQuery<LadderSummary>({
    queryKey: LADDER_QUERY_KEY,
    queryFn: async () => {
      const res = await fetch('/api/ladder')
      if (!res.ok) throw new Error('Failed to load ladder data')
      const payload = await res.json()
      if (!payload.ok) throw new Error(payload?.error?.message || 'Failed to load ladder data')
      return payload.data as LadderSummary
    },
    staleTime: 30_000,
  })

  const updateMutation = useMutation({
    mutationFn: async (payload: LadderUpdatePayload) => {
      const res = await fetch('/api/ladder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Failed to update ladder standing')
      const data = await res.json()
      if (!data.ok) throw new Error(data?.error?.message || 'Failed to update ladder standing')
      return data.data as LadderSummary
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: LADDER_QUERY_KEY }),
  })

  return {
    data: ladderQuery.data,
    loading: ladderQuery.isLoading,
    error: ladderQuery.isError ? 'Failed to load ladder data' : null,
    refresh: () => qc.invalidateQueries({ queryKey: LADDER_QUERY_KEY }),
    updateLadder: (payload: LadderUpdatePayload) => updateMutation.mutateAsync(payload),
  }
}
