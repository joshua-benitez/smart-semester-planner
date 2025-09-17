'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { LadderSummary, LadderUpdatePayload } from '@/types/ladder'

const LADDER_QUERY_KEY = ['ladder']

export function useLadder() {
  const qc = useQueryClient()

  const ladderQuery = useQuery<LadderSummary>({
    queryKey: LADDER_QUERY_KEY,
    queryFn: async () => {
      const res = await fetch('/api/ladder')
      if (!res.ok) throw new Error('Failed to load ladder data')
      return res.json()
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
      return res.json()
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
